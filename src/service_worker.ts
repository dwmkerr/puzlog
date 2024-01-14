import * as extensionInterface from "./extensionInterface";
import { storageKeyFromPuzzleId } from "./helpers";
import { PuzzleRepository } from "./lib/PuzzleRepository";
import {
  ContentScriptInterface,
  ContentScriptStatus,
  FinishPuzzleCommand,
  StartPuzzleCommand,
  UpdatePuzzleCommand,
} from "./lib/extensionMessages";
import { PuzzleState, PuzzleStatus } from "./lib/puzzleState";

//  TODO: at this point we could actually scan each tab and see if it has a
//  loaded puzlog content script and then reload it, based on options for the
//  extension.

//  Instantiate a puzzle repository.
const puzzleRepository = new PuzzleRepository(chrome.storage.local);

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
      metadata: {
        title: null,
        setter: null,
        series: null,
      },
    };

    //  Save back to storage, broadcast updated state to the extension and the tab.
    await puzzleRepository.save(puzzle);
    await stateUpdated(puzzle);
  }
);

extensionInterface.onMessage(
  "finish",
  async (tabId, message: FinishPuzzleCommand) => {
    //  Load the puzzle by id.
    const puzzle = await puzzleRepository.loadPuzzle(message.puzzleId);
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
    await puzzleRepository.save(updatedPuzzle);
    await stateUpdated(updatedPuzzle);
  }
);

extensionInterface.onMessage(
  "UpdatePuzzle",
  async (tabId, message: UpdatePuzzleCommand) => {
    //  Load the puzzle by id.
    const puzzle = await puzzleRepository.loadPuzzle(message.puzzleId);
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
    await puzzleRepository.save(updatedPuzzle);
    await stateUpdated(updatedPuzzle);
  }
);

//  When a tab changes, we want to update the icon based on what the crossword
//  state is. This means we'll need to send a message to the content script
//  telling it to update the icon (if it is loaded).
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await chrome.tabs.get(tabId);
  //  Don't try and interact with internal / chrome tabs.
  if (tab.url === undefined || tab.url?.startsWith("chrome://")) {
    return;
  }
  await updateIcon(tabId);
});

//listen for current tab to be changed
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  //  Don't try and interact with internal / chrome tabs.
  if (tab.url === undefined || tab.url?.startsWith("chrome://")) {
    return;
  }
  await updateIcon(tabId);
});

async function updateIcon(tabId: number) {
  //  Helper to quickly set the icons...
  const setActionIcon = (variant: string) => {
    chrome.action.setIcon({
      path: {
        "16": `images/icon16${variant}.png`,
        "32": `images/icon32${variant}.png`,
        "128": `images/icon128${variant}.png`,
      },
      tabId,
    });
  };

  //  We will only update the icon on loaded pages. Anything else gets the
  //  vanilla icon.
  const contentScriptStatus =
    await ContentScriptInterface.getContentScriptStatus(tabId);
  if (contentScriptStatus !== ContentScriptStatus.Loaded) {
    setActionIcon("");
    return;
  }

  //  We have a loaded content script so can safely get puzzle status.
  const tabStatus = await ContentScriptInterface.getTabPuzzleStatus(tabId);
  const puzzle = await puzzleRepository.loadPuzzle(tabStatus.puzzleId);

  //  Based on the status, set the icon.
  switch (puzzle?.status) {
    case PuzzleStatus.Started:
      setActionIcon("-started");
      break;
    case PuzzleStatus.Finished:
      setActionIcon("-finished");
      break;
    case PuzzleStatus.Unknown:
    case PuzzleStatus.NotStarted:
    default:
      setActionIcon("");
      break;
  }
}
