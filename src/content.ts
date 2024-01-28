import * as extensionInterface from "./extensionInterface";
import { ExtensionOverlay } from "./apps/ExtensionOverlay";
import { puzzleIdFromUrl } from "./lib/helpers";
import { Stopwatch } from "./lib/stopwatch";
import { PuzzleRepository } from "./lib/PuzzleRepository";
import {
  CrosswordMetadata,
  enrichMetadata,
  scrapeCrosswordMetadata,
} from "./lib/crossword-metadata";
import { Puzzle, PuzzleStatus } from "./lib/puzzle";
import { TabPuzzleData } from "./lib/extensionMessages";

//  Instantiate a puzzle repository.
const puzzleRepository = new PuzzleRepository();

//  Typically called by the popup to find out our current puzzle id.
extensionInterface.onMessage(
  "getTabPuzzleStatus",
  async (): Promise<TabPuzzleData> => ({
    puzzleId: localExtensionState.puzzleId,
    status: localExtensionState.puzzleStatus,
    crosswordMetadata: localExtensionState.crosswordMetadata,
  })
);

//  Typically called by the popup when the user has decided to start working on
//  a puzzle.
extensionInterface.onMessage("startTabPuzzle", async () => {
  //  Asset that the user is logged in. If they are not we will have to fail.
  const user = puzzleRepository.getAuth().currentUser;
  if (!user) {
    throw new Error(`user is not logged in`);
  }

  // const puzzlesRef = collection(db, "puzzles");
  // addDoc(puzzlesRef, {
  //   userId: user.uid,
  //   // Other puzzle data...
  // });
  //  This is where we create the initial puzzle object.
  const now = new Date();
  const puzzle: Omit<Puzzle, "id"> = {
    userId: user.uid,
    url: localExtensionState.url,
    //  TODO: auto set the proper ttitle
    title: localExtensionState.title,
    status: PuzzleStatus.Started,
    timeLoad: now,
    timeLastAccess: now,
    timeStart: now,
    timeFinish: null,
    elapsedTime: 0,
    hintsOrMistakes: 0,
    rating: null,
    notes: "",
    metadata: localExtensionState.crosswordMetadata,
  };

  //  Save the newly created puzzle, show the overlay.
  const savedPuzzle = await puzzleRepository.create(puzzle);
  showTimerAndOverlay(savedPuzzle);
});

//  When the puzzle is finished, we can stop the stopwatch.
extensionInterface.onMessage("startTabPuzzle", async () => {
  localExtensionState.stopwatch.pause();
});

function showTimerAndOverlay(puzzle: Puzzle) {
  //  Create the extension interface. It will remain hidden until we show it.
  localExtensionState.extensionOverlay = ExtensionOverlay.create(
    document,
    puzzle.id,
    puzzle
  );

  //  Set the stopwatch time. If the puzzle is started, start the stopwatch.
  localExtensionState.stopwatch.setElapsedTime(puzzle.elapsedTime);
  if (puzzle.status === PuzzleStatus.Started) {
    localExtensionState.stopwatch.start(async (elapsedTime: number) => {
      //  Update the elapsed time.
      puzzleRepository.update(puzzle.id, {
        elapsedTime: elapsedTime,
      });
    }, 1000);
  }
}

async function startup() {
  console.log("initialising puzlog...");

  //  Wait for the current user. Assume we cannot load any puzzle data for now.
  const user = await puzzleRepository.waitForUser();
  localExtensionState.puzzleId = "";
  localExtensionState.puzzleStatus = PuzzleStatus.NotStarted;
  let puzzle: Puzzle | null = null;

  //  Scrape the crossword metadata. We will use this later to either enrich
  //  the puzzle we are currently working on, or show some inforamation about
  //  the puzzle in the action popup.
  localExtensionState.crosswordMetadata = scrapeCrosswordMetadata(
    location.href,
    document
  );

  //  If we are signed in, try and load the puzzle data in case the user has
  //  already worked on it.
  if (user) {
    puzzle = await puzzleRepository.queryPuzzleByUrl(
      puzzleIdFromUrl(location.href)
    );
  }

  //  If we have loaded the puzzle, we can set its state locally, enrich it and
  //  start the timer.
  if (puzzle) {
    //  Update the extension state.
    localExtensionState.puzzleId = puzzle.id;
    localExtensionState.puzzleStatus = puzzle.status;

    //  It is possible that our metadata we have just scraped is not set in the
    //  crossword, or only partially set. If so set it now. This'll happen if we
    //  didn't scrape everything we can before.
    if (localExtensionState.crosswordMetadata) {
      puzzle.metadata = enrichMetadata(
        puzzle.metadata,
        localExtensionState.crosswordMetadata
      );
      await puzzleRepository.save(puzzle);
    }

    //  Show the overlay and start the timer.
    showTimerAndOverlay(puzzle);
  }

  //  We'll now wait for visibility changes (e.g. chrome minimised, tab hidden
  //  and so on). If the timer has been started, we'll pause it when the tab
  //  becomes invisible. We could make it an option to automatically restart
  //  the timer when it is visible again.
  document.addEventListener("visibilitychange", () => {
    log(`visibilitychanged - ${document.visibilityState}`);
    if (document.visibilityState === "visible") {
      //  If we have a started crossword, resume the stopwatch.
      if (localExtensionState.puzzleStatus === PuzzleStatus.Started) {
        localExtensionState.stopwatch.resume();
      }
    } else {
      //  If we have a started crossword, pause the stopwatch.
      if (localExtensionState.puzzleStatus === PuzzleStatus.Started) {
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
  puzzleId: "",
  puzzleStatus: PuzzleStatus.Unknown,
  stopwatch: new Stopwatch(),
  extensionOverlay: null as ExtensionOverlay | null,
  crosswordMetadata: {} as CrosswordMetadata,
};

function log(message: string) {
  console.log(`puzlog(${localExtensionState.puzzleId}): ${message}`);
}

//  Start the extension.
(async () => {
  //  Get the meta tag that tracks out content script status and set it to
  //  'loading'. This is essential so that things like the background script
  //  can know whether the tab has a loaded content script.
  const statusMetaName = "puzlog-content-script-status";
  let contentScriptStatusTag = document.querySelector(
    `meta[name="${statusMetaName}"]`
  );
  if (!contentScriptStatusTag) {
    contentScriptStatusTag = document.createElement("meta");
    contentScriptStatusTag.setAttribute("name", statusMetaName);
    document.head.appendChild(contentScriptStatusTag);
  }
  contentScriptStatusTag.setAttribute("content", "loading");

  //  Start the content script code, preparing the DOM etc.
  try {
    await startup();
  } catch (err) {
    //  Update the status to 'failed' - we've errored.
    console.error("puzlog: error initialising extension", err);
    contentScriptStatusTag.setAttribute("content", "errored");
  }

  //  Update the status to 'loaded' - we're good to go.
  contentScriptStatusTag.setAttribute("content", "loaded");
})();
