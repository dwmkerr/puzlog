import * as extensionInterface from "./extensionInterface";
import { storageKeyFromPuzzleId } from "./helpers";
import {
  FinishPuzzleCommand,
  StartPuzzleCommand,
  StateUpdatedCommand,
} from "./lib/extensionMessages";
import { PuzzleStatus, TimerState } from "./lib/puzzleState";

//  TODO retire ASAP
extensionInterface.onMessage(
  "stateUpdated",
  async (tabId, message: StateUpdatedCommand) => {
    //  If we have a tab id - forward it. I'm sure we can retire this soon.
    if (tabId) {
      extensionInterface.sendTabMessage("tabStateUpdated", tabId, {
        tabId: tabId,
        ...message,
      });
    }
  }
);

extensionInterface.onMessage("OpenPuzlogTab", async () => {
  chrome.tabs.create({
    url: chrome.runtime.getURL("puzlog.html"),
  });
});

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
      timerState: TimerState.Stopped,
      hintsOrMistakes: 0,
      rating: null,
      notes: "",
    };

    //  Save back to storage, broadcast updated state to the extension and the tab.
    extensionInterface.savePuzzle(puzzle);
    extensionInterface.sendRuntimeMessage("stateUpdated", {
      puzzleState: puzzle,
    });
    if (tabId) {
      extensionInterface.sendTabMessage("tabStateUpdated", tabId, {
        tabId: tabId,
        puzzleState: puzzle,
      });
    }
  }
);

extensionInterface.onMessage(
  "finish",
  async (tabId, message: FinishPuzzleCommand) => {
    //  Load the puzzle by id.
    const puzzles = await extensionInterface.loadPuzzles();
    const puzzle = puzzles.find((p) => p.puzzleId === message.puzzleId);
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
      timerState: TimerState.Stopped,
      timeFinish: now,
      status: PuzzleStatus.Finished,
    };

    //  Save back to storage, broadcast updated state to the extension and the tab.
    extensionInterface.savePuzzle(updatedPuzzle);
    extensionInterface.sendRuntimeMessage("stateUpdated", {
      puzzleState: updatedPuzzle,
    });
    if (tabId) {
      extensionInterface.sendRuntimeMessage("tabStateUpdated", {
        tabId: tabId,
        puzzleState: updatedPuzzle,
      });
    }
  }
);
