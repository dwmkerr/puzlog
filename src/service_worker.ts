import * as extensionInterface from "./extensionInterface";
import {
  FinishPuzzleCommand,
  StartPuzzleCommand,
  StateUpdatedCommand,
} from "./lib/extensionMessages";
import { PuzzleStatus, TimerState } from "./lib/puzzleState";

chrome.runtime.onMessage.addListener((request) => {
  if (request.command === extensionInterface.RuntimeMessages.OpenPuzlogTab) {
    chrome.tabs.create({
      url: chrome.runtime.getURL("puzlog.html"),
    });
  }
});

extensionInterface.onRuntimeMessage(
  "stateUpdated",
  async (tabId, message: StateUpdatedCommand) => {
    extensionInterface.sendTabMessage("tabStateUpdated", tabId, {
      tabId: tabId,
      ...message,
    });
  }
);

extensionInterface.onRuntimeMessage(
  "start",
  async (tabId, message: StartPuzzleCommand) => {
    //  Load the puzzle by id.
    const puzzles = await extensionInterface.loadPuzzles();
    const puzzle = puzzles.find((p) => p.puzzleId === message.puzzleId);
    if (!puzzle) {
      throw new Error(
        `puzlog: unable to find puzzle with id '${message.puzzleId}'`
      );
    }

    //  Update the puzzle into a started state.
    const now = new Date();
    const updatedPuzzle = {
      ...puzzle,
      status: PuzzleStatus.Started,
      timeLastAccess: now,
      timeStart: puzzle.timeStart || now, // only update start time if clean
      timerState: TimerState.Started,
    };

    //  Save back to storage, broadcast updated state to the extension and the tab.
    extensionInterface.savePuzzle(updatedPuzzle);
    extensionInterface.sendRuntimeMessage("stateUpdated", {
      puzzleState: updatedPuzzle,
    });
    if (tabId) {
      extensionInterface.sendTabMessage("tabStateUpdated", tabId, {
        tabId: tabId,
        puzzleState: updatedPuzzle,
      });
    }
  }
);

extensionInterface.onRuntimeMessage(
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
