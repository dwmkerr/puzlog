import * as extensionInterface from "./extensionInterface";
import { ExtensionOverlay } from "./lib/ExtensionOverlay";
import { puzzleIdFromUrl, storageKeyFromPuzzleId } from "./helpers";
import {
  TimerState,
  PuzzleState,
  PuzzleStatus,
  fromSerializableObject,
} from "./lib/puzzleState";
import { Stopwatch } from "./stopwatch";

//  Typically called by the popup to find out our current puzzle id.
extensionInterface.onMessage("getTabPuzzleStatus", async () => ({
  puzzleId: localExtensionState.puzzleState.puzzleId,
  puzzleStatus: localExtensionState.puzzleState.status,
}));

//  Typically called by the popup when the user has decided to start working on
//  a puzzle.
extensionInterface.onMessage("startTabPuzzle", async () => {
  // extensionInterface.sendTabMessage("startTabPuzzle", tabId, {
  //   puzzleId: puzzleId,
  // });
  extensionInterface.sendRuntimeMessage("start", {
    puzzleId: localExtensionState.puzzleState.puzzleId,
    url: location.href,
    title: document.title,
  });
  localExtensionState.extensionOverlay?.show();
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
    status: PuzzleStatus.NotStarted,
    timeLoad: now,
    timeLastAccess: now,
    timeStart: now,
    timeFinish: null,
    elapsedTime: 0,
    timerState: TimerState.Stopped,
    hintsOrMistakes: 0,
    rating: null,
    notes: "",
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

    //  No matter what state the timer was in, it is stopped when we load a
    //  puzzle from storage (as timers are ephemeral to the extension).
    return {
      ...storedPuzzleState,
      timerState: TimerState.Stopped,
    };
  } catch (err) {
    console.error(
      `unable to convert saved state to puzzle state, puzzle state will be reset`,
      err
    );
    return null;
  }
}

//  legacy start function, with stopwatch code only now...
// async function startPuzzle(currentState: PuzzleState): Promise<PuzzleState> {
//   //  If we are already started, we're done.
//   if (currentState.timerState === TimerState.Started) {
//     return currentState;
//   }
//   localExtensionState.stopwatch.setElapsedTime(
//     localExtensionState.puzzleState.elapsedTime
//   );
//   localExtensionState.stopwatch.start(async (elapsedTime: number) => {
//     //  Update our on-page timer.
//     localExtensionState?.extensionOverlay?.update(msToTime(elapsedTime));
//     //  Broadcast the updated state to the extension.
//     localExtensionState.puzzleState.elapsedTime = elapsedTime;
//     await saveState(localExtensionState.puzzleState);
//   }, 1000);
// }

//  legacy stop function, for reference only.
// async function stopPuzzle(currentState: PuzzleState): Promise<PuzzleState> {
//   console.log(`stopping puzzle...`);
//   //  If we are already started, we're done.
//   if (currentState.timerState === TimerState.Stopped) {
//     return currentState;
//   }
//   //  Stop the stopwatch.
//   localExtensionState.stopwatch.pause();
// }

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

  //  The refactored logic that aims to move most code out of content.js starts
  //  here.

  //  Create the extension interface. It will remain hidden until we show it.
  localExtensionState.extensionOverlay = ExtensionOverlay.create(
    document,
    puzzleId
  );

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
  extensionOverlay: null as ExtensionOverlay | null,
};

function log(message: string) {
  console.log(`puzlog(${localExtensionState.puzzleState.title}): ${message}`);
}

//  Start the extension.
(async () => {
  await startup();
})();
