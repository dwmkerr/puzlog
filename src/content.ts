import * as extensionInterface from "./extensionInterface";
import { ExtensionOverlay } from "./apps/toolbar/ExtensionOverlay";
import { puzzleIdFromUrl } from "./lib/helpers";
import { PuzzleRepository } from "./lib/PuzzleRepository";
import { Puzzle, PuzzleStatus } from "./lib/puzzle";
import { TabPuzzleData } from "./lib/extensionMessages";
import { User } from "firebase/auth";
import {
  enrichMetadata,
  findMetadataProvider,
} from "./lib/crossword-metadata/crossword-metadata";
import { CrosswordMetadata } from "./lib/crossword-metadata/CrosswordMetadataProvider";

//  Instantiate a puzzle repository.
const puzzleRepository = PuzzleRepository.get();

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
  const user = await puzzleRepository.waitForUser();
  if (!user) {
    throw new Error(`user is not logged in`);
  }

  //  This is where we create the initial puzzle object.
  const now = new Date();
  const puzzle: Omit<Puzzle, "id"> = {
    userId: user.uid,
    url: puzzleIdFromUrl(localExtensionState.url),
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
    metadata: localExtensionState.crosswordMetadata || {},
  };

  //  Save the newly created puzzle, show the overlay.
  const savedPuzzle = await puzzleRepository.create(puzzle);
  showTimerAndOverlay(savedPuzzle);
});

function showTimerAndOverlay(puzzle: Puzzle | undefined) {
  //  Create or update the extension overlay.
  if (!localExtensionState.extensionOverlay) {
    localExtensionState.extensionOverlay = ExtensionOverlay.create(
      document,
      puzzle
    );
  } else {
    localExtensionState.extensionOverlay.render(puzzle);
  }
}

async function startup() {
  console.log("initialising puzlog...");

  //  Wait for the current user. Assume we cannot load any puzzle data for now.
  console.log("puzlog: checking for cached sign in...");
  let user: User | null = null;
  try {
    //  See if we can simply load the user state from firebase.
    user = await puzzleRepository.waitForUser();

    //  As a fallback, try and sign in with the cached token.
    if (!user) {
      user = await puzzleRepository.signInWithCachedToken();
    }
  } catch (err) {
    console.log("puzlog: cached token error", err);
  }
  console.log("puzlog: got user", user);

  localExtensionState.puzzleId = "";
  localExtensionState.puzzleStatus = PuzzleStatus.NotStarted;
  let puzzle: Puzzle | undefined = undefined;

  //  Scrape the crossword metadata. We will use this later to either enrich
  //  the puzzle we are currently working on, or show some inforamation about
  //  the puzzle in the action popup.
  const metadataProvider = findMetadataProvider(location.href, document);
  localExtensionState.crosswordMetadata =
    metadataProvider?.loadMetadata(location.href, document) || null;

  //  If we are signed in, try and load the puzzle data in case the user has
  //  already worked on it.
  if (user) {
    puzzle =
      (await puzzleRepository.queryPuzzleByUrl(
        puzzleIdFromUrl(location.href)
      )) || undefined;
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
  }

  //  If we have a puzzle OR we have identified a provider, show the overlay.
  if (puzzle || metadataProvider) {
    //  Show the overlay. This will also start the timer if the puzzle is in
    //  the 'started' state.
    showTimerAndOverlay(puzzle);
  }

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
  extensionOverlay: null as ExtensionOverlay | null,
  crosswordMetadata: null as Partial<CrosswordMetadata> | null,
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
