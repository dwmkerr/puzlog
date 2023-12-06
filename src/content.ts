import { puzzleIdFromUrl, storageKeyFromPuzzleId } from "./helpers";
import { TimerState, PuzzleState } from "./puzzleState";

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
      //  Bail if we are started.
      if (state.timerState === TimerState.Started) {
        return;
      }
      const newState = await startPuzzle(state);
      await saveState(newState);
      sendResponse(newState);
    } else if (command === "stop") {
      const state = localExtensionState.puzzleState;
      //  Bail if we are stoped.
      if (state.timerState === TimerState.Stopped) {
        return;
      }
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
    durationWorking: 0,
    timerState: TimerState.Stopped,
    timerId: null,
  };
  return state;
}

async function loadState(storageKey: string): Promise<PuzzleState | null> {
  //  Grab the puzzle state.
  console.log(`checking for saved puzzle state...`);
  const storage = await chrome.storage.local.get(storageKey);
  const storageObject = storage[storageKey];
  const storedPuzzleState = storageObject as PuzzleState;

  //  If there is no stored puzzle state, we're done.
  if (!storedPuzzleState) {
    console.log(`no saved state exists.`);
    return null;
  }

  //  ...otherwise, return our saved state.
  console.log(`found saved state from ${storedPuzzleState.timeLastAccess}`);
  return storedPuzzleState;
}

async function startPuzzle(currentState: PuzzleState): Promise<PuzzleState> {
  console.log(`starting puzzle...`);
  //  This could be a clean start or a resume. Start the timer and update the
  //  state.
  const now = new Date();

  //  TODO we could improve on this by changing the duration and then firing
  //  a more specific event to the runtime to let the popup (or anything else)
  //  respond without having to watch the entire state. However, this works for
  //  now.
  let lastTick = now;
  const intervalId = window.setInterval(async () => {
    const thisTick = new Date();
    const tickDuration = thisTick.getTime() - lastTick.getTime();
    localExtensionState.puzzleState.durationWorking += tickDuration;
    lastTick = thisTick;
    await saveState(localExtensionState.puzzleState);
  }, 1000);

  return {
    ...currentState,
    timeLastAccess: now,
    timeStart: currentState.timeStart || now, // only update start time if clean
    timerState: TimerState.Started,
    timerId: intervalId,
  };
}

async function stopPuzzle(currentState: PuzzleState): Promise<PuzzleState> {
  console.log(`stopping puzzle...`);
  //  Stop the timer.
  if (currentState.timerId) {
    window.clearInterval(currentState.timerId);
  }

  //  Update the state.
  const now = new Date();
  return {
    ...currentState,
    timeFinish: now,
    timeLastAccess: now,
    timerState: TimerState.Stopped,
    timerId: null,
  };
}

async function saveState(currentState: PuzzleState): Promise<void> {
  console.log(`${currentState.storageKey}: saving for puzzle state`);
  localExtensionState.puzzleState = currentState;
  const items = {
    [currentState.storageKey]: currentState,
  };
  await chrome.storage.local.set(items);
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
  // const alwaysStartClean = true;
  // console.log(`initialising clean state`);
  // const state = alwaysStartClean ? initState(url, document.title) : savedState;

  //  We won't need this check in the future, but for now avoids warnings.
  if (state === null) {
    throw new Error(`failed to initialise puzzle state`);
  }

  //  Record the puzzle state, we're now good to go.
  localExtensionState.puzzleState = state;
  console.log(`...puzlog started`);
  return state;
}

//  This is the state local to each tab. It's basically a local copy of the
//  puzzle state and data for the timer.
const localExtensionState = {
  puzzleState: {} as PuzzleState,
};

//  Start the extension.
(async () => {
  await startup();
})();
