import * as extensionInterface from "./extensionInterface";
import { storageKeyFromPuzzleId } from "./helpers";
import {
  FinishPuzzleCommand,
  StartPuzzleCommand,
  UpdatePuzzleCommand,
} from "./lib/extensionMessages";
import { PuzzleState, PuzzleStatus } from "./lib/puzzleState";

extensionInterface.onMessage("OpenPuzlogTab", async () => {
  chrome.tabs.create({
    url: chrome.runtime.getURL("puzlog.html"),
  });
});

//  This helper sends the 'state updated' message to the extension and also the
//  active tab.
async function stateUpdated(puzzleState: PuzzleState) {
  // TODO TODO TODO - this is where the goofiness seems to lie. If we uncomment
  // both then things bork - maybe try ports?
  // await extensionInterface.sendRuntimeMessage("stateUpdated", {
  //   puzzleState,
  // });
  const [activeTab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });
  if (activeTab?.id) {
    await extensionInterface.sendTabMessage("stateUpdated", activeTab.id, {
      puzzleState,
    });
  }
}

extensionInterface.onMessage(
  "start",
  async (tabId, message: StartPuzzleCommand) => {
    //  Craate the initial puzzle structure.
    const storageKey = storageKeyFromPuzzleId(message.puzzleId);
    const now = new Date();
    const puzzle = {
      puzzleId: message.puzzleId,
      url: message.url,
      title: message.title,
      storageKey,
      status: PuzzleStatus.Started,
      timeLoad: now,
      timeLastAccess: now,
      timeStart: now,
      timeFinish: null,
      elapsedTime: 0,
      hintsOrMistakes: 0,
      rating: null,
      notes: "",
    };

    //  Save back to storage, broadcast updated state to the extension and the tab.
    await extensionInterface.savePuzzle(puzzle);
    await stateUpdated(puzzle);
  }
);

extensionInterface.onMessage(
  "finish",
  async (tabId, message: FinishPuzzleCommand) => {
    //  Load the puzzle by id.
    const puzzle = await extensionInterface.loadPuzzle(message.puzzleId);
    if (!puzzle) {
      throw new Error(
        `puzlog: unable to find puzzle with id '${message.puzzleId}'`
      );
    }

    //  Update the puzzle into a finished state.
    const now = new Date();
    const updatedPuzzle = {
      ...puzzle,
      timeLastAccess: now,
      timeFinish: now,
      status: PuzzleStatus.Finished,
    };

    //  Save back to storage, broadcast updated state to the extension and the tab.
    await extensionInterface.savePuzzle(updatedPuzzle);
    await stateUpdated(updatedPuzzle);
  }
);

extensionInterface.onMessage(
  "UpdatePuzzle",
  async (tabId, message: UpdatePuzzleCommand) => {
    //  Load the puzzle by id.
    const puzzle = await extensionInterface.loadPuzzle(message.puzzleId);
    if (!puzzle) {
      throw new Error(
        `puzlog: unable to find puzzle with id '${message.puzzleId}'`
      );
    }

    //  Update the state.
    const updatedPuzzle = {
      ...puzzle,
      ...message.updatedValues,
    };

    //  Save back to storage, broadcast updated state to the extension and the tab.
    await extensionInterface.savePuzzle(updatedPuzzle);
    await stateUpdated(updatedPuzzle);
  }
);
