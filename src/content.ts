import * as extensionInterface from "./extensionInterface";
import { ExtensionOverlay } from "./lib/ExtensionOverlay";
import { puzzleIdFromUrl } from "./helpers";
import { Stopwatch } from "./stopwatch";

//  Typically called by the popup to find out our current puzzle id.
extensionInterface.onMessage("getTabPuzzleStatus", async () => ({
  puzzleId: localExtensionState.puzzleId,
  started: localExtensionState.started,
}));

//  Typically called by the popup when the user has decided to start working on
//  a puzzle.
extensionInterface.onMessage("startTabPuzzle", async () => {
  //  Start the puzzle - this'll track it in local storage etc.
  extensionInterface.sendRuntimeMessage("start", {
    puzzleId: localExtensionState.puzzleId,
    url: localExtensionState.url,
    title: localExtensionState.title,
  });

  //  Now start the timer and show the overlay.
  startTimerAndShowOverlay();
});

function startTimerAndShowOverlay() {
  //  Update our local status.
  localExtensionState.started = true;

  //  Start the stopwatch. On each tick, refresh the timer on the screen.
  localExtensionState.stopwatch.start(async (elapsedTime: number) => {
    //  Update the elapsed time.
    // extensionInterface.sendRuntimeMessage("UpdatePuzzle", {
    //   puzzleId: localExtensionState.puzzleId,
    //   updatedValues: {
    //     elapsedTime: elapsedTime,
    //   },
    // });
  }, 1000);

  localExtensionState.extensionOverlay?.show();
}

async function startup() {
  console.log("initialising puzlog...");

  //  Create the extension interface. It will remain hidden until we show it.
  localExtensionState.extensionOverlay = ExtensionOverlay.create(
    document,
    localExtensionState.puzzleId
  );

  //  Try and load the puzzle from storage. If it's not present, it hasn't been
  //  started yet.
  const puzzle = await extensionInterface.loadPuzzle(
    localExtensionState.puzzleId
  );

  //  If the puzzle has been loaded, we can start the stopwatch.
  if (puzzle) {
    //  Now start the timer and show the overlay.
    startTimerAndShowOverlay();
  }

  //  We'll now wait for visibility changes (e.g. chrome minimised, tab hidden
  //  and so on). If the timer has been started, we'll pause it when the tab
  //  becomes invisible. We could make it an option to automatically restart
  //  the timer when it is visible again.
  document.addEventListener("visibilitychange", () => {
    log(`visibilitychanged - ${document.visibilityState}`);
    if (document.visibilityState === "visible") {
      //  If we have a started crossword, resume the stopwatch.
      if (localExtensionState.started) {
        localExtensionState.stopwatch.resume();
      }
    } else {
      //  If we have a started crossword, pause the stopwatch.
      if (localExtensionState.started) {
        localExtensionState.stopwatch.pause();
      }
    }
  });

  log("...initialised");
}

//  This is the state local to each tab. It's basically a local copy of the
//  puzzle state and data for the timer. We can also move the bulk of this logic
//  into its own class later.
const localExtensionState = {
  url: location.href,
  title: document.title,
  puzzleId: puzzleIdFromUrl(location.href),
  started: false,
  stopwatch: new Stopwatch(),
  extensionOverlay: null as ExtensionOverlay | null,
};

function log(message: string) {
  console.log(`puzlog(${localExtensionState.puzzleId}): ${message}`);
}

//  Start the extension.
(async () => {
  await startup();
})();
