import * as extensionInterface from "./extensionInterface";
import { isExtensionAccessibleTab } from "./lib/helpers";
import { PuzzleRepository } from "./lib/PuzzleRepository";
import {
  ContentScriptInterface,
  ContentScriptStatus,
  FinishPuzzleCommand,
} from "./lib/extensionMessages";
import { PuzzleStatus } from "./lib/puzzleState";

//  TODO: at this point we could actually scan each tab and see if it has a
//  loaded puzlog content script and then reload it, based on options for the
//  extension.

//  Instantiate a puzzle repository.
const puzzleRepository = new PuzzleRepository();

extensionInterface.onMessage("OpenPuzlogTab", async () => {
  chrome.tabs.create({
    url: chrome.runtime.getURL("puzlog.html"),
  });
});

extensionInterface.onMessage(
  "finish",
  async (tabId, message: FinishPuzzleCommand) => {
    //  Update the puzzle into a finished state.
    const now = new Date();
    await puzzleRepository.update(message.puzzleId, {
      timeLastAccess: now.toISOString(),
      timeFinish: now.toISOString(),
      status: PuzzleStatus[PuzzleStatus.Finished],
    });
  }
);

extensionInterface.onMessage(
  "resume",
  async (tabId, message: FinishPuzzleCommand) => {
    //  Update the puzzle into a started state.
    const now = new Date();
    await puzzleRepository.update(message.puzzleId, {
      timeLastAccess: now.toISOString(),
      timeFinish: null,
      status: PuzzleStatus[PuzzleStatus.Started],
    });
  }
);

//  When a tab changes, we want to update the icon based on what the crossword
//  state is. This means we'll need to send a message to the content script
//  telling it to update the icon (if it is loaded).
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await chrome.tabs.get(tabId);
  //  Don't try and interact with internal / chrome tabs.
  if (!isExtensionAccessibleTab(tab.url)) {
    return;
  }
  await updateIcon(tabId);
});

//listen for current tab to be changed
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  //  Don't try and interact with internal / chrome tabs.
  if (!isExtensionAccessibleTab(tab.url)) {
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

  //  Based on the status, set the icon.
  switch (tabStatus.status) {
    case PuzzleStatus.NotStarted:
      setActionIcon(tabStatus.crosswordMetadata ? "-start" : "-start-unknown");
      break;
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
