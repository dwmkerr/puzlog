import * as extensionInterface from "./extensionInterface";
import { ExtensionOverlay } from "./apps/ExtensionOverlay";
import { puzzleIdFromUrl } from "./lib/helpers";
import { Stopwatch } from "./lib/stopwatch";
import { PuzzleRepository } from "./lib/PuzzleRepository";
import {
  CrosswordMetadata,
  scrapeString,
  scrapers,
} from "./lib/crossword-metadata";
import { PuzzleState, PuzzleStatus } from "./lib/puzzleState";
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
  //  This is where we create the initial puzzle object.
  const now = new Date();
  const puzzle: Omit<PuzzleState, "id"> = {
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

function showTimerAndOverlay(puzzle: PuzzleState) {
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

function scrapeCrosswordMetadata(
  href: string,
  document: Document
): CrosswordMetadata {
  //  If the puzzle hasn't been loaded, we can check its metadata.
  const scraper = scrapers.find((scraper) => {
    console.log(`puzlog: testing scraper ${scraper.seriesName}`);
    const match = scraper.hrefTest.test(href);
    console.log(`puzlog: match ${match}`);
    return match;
  });

  if (!scraper) {
    return { setter: null, title: null, series: null, datePublished: null };
  }
  return {
    series: scraper.seriesName,
    title: scrapeString(document, scraper.title) || "",
    setter: scrapeString(document, scraper.setter) || "",
    datePublished: new Date(), // TODO scrapeString(document, scraper.setter) || "",
  };
}

async function startup() {
  console.log("initialising puzlog...");

  //  Try and load the puzzle from storage. If it's not present, it hasn't been
  //  started yet.
  const puzzle = await puzzleRepository.queryPuzzleByUrl(
    puzzleIdFromUrl(location.href)
  );
  localExtensionState.puzzleId = puzzle?.id || "";
  localExtensionState.puzzleStatus = puzzle?.status || PuzzleStatus.NotStarted;

  //  Scrape the crossword metadata.
  localExtensionState.crosswordMetadata = scrapeCrosswordMetadata(
    location.href,
    document
  );

  //  It is possible that our metadata we have just scraped is not set in the
  //  crossword, if so set it now. This'll happen if we re-open a crossword
  //  that didn't have a metadata scraper before.
  if (puzzle && !puzzle.metadata && localExtensionState.crosswordMetadata) {
    puzzle.metadata = localExtensionState.crosswordMetadata;
    await puzzleRepository.save(puzzle);
  }

  //  If the puzzle has been loaded, we can show the overlay and start the timer.
  if (puzzle) {
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
  await startup();

  //  Update the status to 'loaded' - we're good to go.
  contentScriptStatusTag.setAttribute("content", "loaded");
})();
