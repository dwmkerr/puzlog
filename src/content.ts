import * as extensionInterface from "./extensionInterface";
import { puzzleIdFromUrl, storageKeyFromPuzzleId } from "./helpers";
import {
  TimerState,
  PuzzleState,
  toSerializableObject,
  fromSerializableObject,
} from "./puzzleState";
import { Stopwatch } from "./stopwatch";

//  Listen for messages, route to the appropriate handlers.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    const source = sender.tab || "extension";
    const command = request.command || "<unknown>";
    const log = `recieved command '${command}' from ${source}`;
    console.log(log);
    if (command === "getState") {
      sendResponse(localExtensionState.puzzleState);
    } else if (command === "start") {
      const state = localExtensionState.puzzleState;
      const newState = await startPuzzle(state);
      await saveState(newState);
      sendResponse(newState);
    } else if (command === "stop") {
      const state = localExtensionState.puzzleState;
      const newState = await stopPuzzle(state);
      await saveState(newState);
      sendResponse(newState);
    } else if (command === "finish") {
      //  We can move the 'finish' logic into its own function later when it
      //  becomes more substantial.
      const state = localExtensionState.puzzleState;
      state.timeFinish = new Date();
      const newState = await stopPuzzle(state);
      await saveState(newState);
      sendResponse(newState);
    } else if (command === "reset") {
      const state = initState(location.href, document.title);
      await saveState(state);
      sendResponse(state);
    }
  })();

  // Important! Return true to indicate you want to send a response asynchronously
  return true;
});

function initState(url: string, title: string): PuzzleState {
  const puzzleId = puzzleIdFromUrl(url);
  const storageKey = storageKeyFromPuzzleId(puzzleId);
  const now = new Date();
  const state = {
    url,
    puzzleId,
    storageKey,
    title,
    timeLoad: now,
    timeLastAccess: now,
    timeStart: now,
    timeFinish: null,
    elapsedTime: 0,
    timerState: TimerState.Stopped,
  };
  return state;
}

async function loadState(storageKey: string): Promise<PuzzleState | null> {
  //  Grab the puzzle state.
  console.log(`checking for saved puzzle state...`);
  const storage = await chrome.storage.local.get(storageKey);
  const storageObject = storage[storageKey];
  if (!storageObject) {
    console.log(`no saved state exists.`);
    return null;
  }
  try {
    const storedPuzzleState = fromSerializableObject(storageObject);
    console.log(`found saved state from ${storedPuzzleState.timeLastAccess}`);
    return storedPuzzleState;
  } catch (err) {
    console.error(
      `unable to convert saved state to puzzle state, puzzle state will be reset`,
      err
    );
    return null;
  }
}

async function startPuzzle(currentState: PuzzleState): Promise<PuzzleState> {
  console.log(`starting puzzle...`);
  const now = new Date();

  //  If we are already started, we're done.
  if (currentState.timerState === TimerState.Started) {
    return currentState;
  }

  //  TODO we could improve on this by changing the duration and then firing
  //  a more specific event to the runtime to let the popup (or anything else)
  //  respond without having to watch the entire state. However, this works for
  //  now.
  localExtensionState.stopwatch.setElapsedTime(
    localExtensionState.puzzleState.elapsedTime
  );
  localExtensionState.stopwatch.start(async (elapsedTime: number) => {
    localExtensionState.puzzleState.elapsedTime = elapsedTime;
    await saveState(localExtensionState.puzzleState);
  }, 1000);

  return {
    ...currentState,
    timeLastAccess: now,
    timeStart: currentState.timeStart || now, // only update start time if clean
    timerState: TimerState.Started,
  };
}

async function stopPuzzle(currentState: PuzzleState): Promise<PuzzleState> {
  console.log(`stopping puzzle...`);
  //  If we are already started, we're done.
  if (currentState.timerState === TimerState.Stopped) {
    return currentState;
  }

  //  Stop the stopwatch.
  localExtensionState.stopwatch.pause();

  //  Update the state.
  const now = new Date();
  return {
    ...currentState,
    timeLastAccess: now,
    timerState: TimerState.Stopped,
  };
}

async function saveState(currentState: PuzzleState): Promise<void> {
  //  If our timer state is changing, we can update the icon.
  if (localExtensionState.puzzleState.timerState !== currentState.timerState) {
    extensionInterface.setIconTimerState(
      currentState.timerState,
      localExtensionState.tabId
    );
  }

  //  Update our local state.
  localExtensionState.puzzleState = currentState;

  //  Create a serializable version of the state.
  const serializableState = toSerializableObject(currentState);

  const items = {
    [currentState.storageKey]: serializableState,
  };
  await chrome.storage.local.set(items);
  if (chrome.runtime.lastError) {
    console.error(
      `error setting state to '${currentState.storageKey}': ${chrome.runtime.lastError.message}`
    );
  }

  //  Notify other parts of the extension that our state is updated.
  chrome.runtime.sendMessage({
    command: "stateUpdated",
    puzzleState: currentState,
  });
}

async function startup(): Promise<PuzzleState> {
  console.log("initialising puzlog...");

  //  Get the current url, puzzle id and storage key.
  const url = location.href;
  const puzzleId = puzzleIdFromUrl(url);
  const storageKey = storageKeyFromPuzzleId(puzzleId);

  //  Try and load the puzzle state from storage. We'll only get a return value
  //  if the user has spent some time on the xword already.
  const savedState = await loadState(storageKey);
  const state = savedState || initState(url, document.title);

  //  We won't need this check in the future, but for now avoids warnings.
  if (state === null) {
    throw new Error(`failed to initialise puzzle state`);
  }

  //  Record the puzzle state and current tab id, we're now good to go.
  localExtensionState.puzzleState = state;
  localExtensionState.tabId = 0; // await extensionInterface.getCurrentTabId();
  log(`${savedState ? "loaded saved state" : "initialised clean state"}`);
  log(`tabId - ${localExtensionState.tabId}`);

  //  We'll now wait for visibility changes (e.g. chrome minimised, tab hidden
  //  and so on). If the timer has been started, we'll pause it when the tab
  //  becomes invisible. We could make it an option to automatically restart
  //  the timer when it is visible again.
  document.addEventListener("visibilitychange", () => {
    log(`visibilitychanged - ${document.visibilityState}`);
    if (document.visibilityState === "visible") {
      //  TODO: consider the option to automatically restart the timer.
    } else {
      //  The document is now no longer visible - pause the timer if needed.
      if (localExtensionState.puzzleState.timerState === TimerState.Started) {
        log(`pausing timer as page is losing visibility...`);
        // const newState = await stopPuzzle(localExtensionState.puzzleState);
        // await saveState(newState);
      }
    }
  });

  log("...initialised");

  return state;
}

//  This is the state local to each tab. It's basically a local copy of the
//  puzzle state and data for the timer. We can also move the bulk of this logic
//  into its own class later.
const localExtensionState = {
  puzzleState: {} as PuzzleState,
  stopwatch: new Stopwatch(),
  tabId: 0 as number,
};

function log(message: string) {
  console.log(`puzlog(${localExtensionState.puzzleState.title}): ${message}`);
}

//  Start the extension.
(async () => {
  await startup();
})();
