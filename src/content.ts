import * as extensionInterface from "./extensionInterface";
import { ExtensionOverlay } from "./lib/ExtensionOverlay";
import { puzzleIdFromUrl } from "./helpers";
import { Stopwatch } from "./lib/stopwatch";
import { PuzzleRepository } from "./lib/PuzzleRepository";
import {
  CrosswordMetadata,
  scrapeString,
  scrapers,
} from "./lib/crossword-metadata";
import { PuzzleStatus } from "./lib/puzzleState";
import { TabPuzzleData } from "./lib/extensionMessages";

//  Instantiate a puzzle repository.
const puzzleRepository = new PuzzleRepository(chrome.storage.local);

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
  //  Start the puzzle - this'll track it in local storage etc.
  extensionInterface.sendRuntimeMessage("start", {
    puzzleId: localExtensionState.puzzleId,
    url: localExtensionState.url,
    title: localExtensionState.title,
  });

  //  Now start the timer and show the overlay. Initial time is 0 secs.
  startTimerAndShowOverlay(0);
});

//  When the puzzle is finished, we can stop the stopwatch.
extensionInterface.onMessage("startTabPuzzle", async () => {
  localExtensionState.stopwatch.pause();
});

function startTimerAndShowOverlay(initialElapsedTime: number) {
  //  Start the stopwatch. On each tick, refresh the timer on the screen.
  localExtensionState.stopwatch.setElapsedTime(initialElapsedTime);
  localExtensionState.stopwatch.start(async (elapsedTime: number) => {
    //  Update the elapsed time.
    extensionInterface.sendRuntimeMessage("UpdatePuzzle", {
      puzzleId: localExtensionState.puzzleId,
      updatedValues: {
        elapsedTime: elapsedTime,
      },
    });
  }, 1000);

  localExtensionState.extensionOverlay?.show();
}

function scrapeCrosswordMetadata(
  href: string,
  document: Document
): CrosswordMetadata | null {
  //  If the puzzle hasn't been loaded, we can check its metadata.
  const scraper = scrapers.find((scraper) => {
    console.log(`puzlog: testing scraper ${scraper.seriesName}`);
    const match = scraper.hrefTest.test(location.href);
    console.log(`puzlog: match ${match}`);
    return match;
  });

  if (!scraper) {
    return null;
  }
  return {
    series: scraper.seriesName,
    title: scrapeString(document, scraper.title) || "",
    setter: scrapeString(document, scraper.setter) || "",
  };
}

async function startup() {
  console.log("initialising puzlog...");

  //  Try and load the puzzle from storage. If it's not present, it hasn't been
  //  started yet.
  const puzzle = await puzzleRepository.loadPuzzle(
    localExtensionState.puzzleId
  );
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

  //  Create the extension interface. It will remain hidden until we show it.
  localExtensionState.extensionOverlay = ExtensionOverlay.create(
    document,
    localExtensionState.puzzleId,
    puzzle
  );

  //  If the puzzle has been loaded, we can show the overlay and start the timer.
  if (puzzle) {
    startTimerAndShowOverlay(puzzle.elapsedTime);
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
  puzzleId: puzzleIdFromUrl(location.href),
  puzzleStatus: PuzzleStatus.Unknown,
  stopwatch: new Stopwatch(),
  extensionOverlay: null as ExtensionOverlay | null,
  crosswordMetadata: null as CrosswordMetadata | null,
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
