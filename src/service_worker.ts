import * as extensionInterface from "./extensionInterface";
import { isExtensionAccessibleTab } from "./lib/helpers";
import { PuzzleRepository } from "./lib/PuzzleRepository";
import {
  ContentScriptInterface,
  ContentScriptStatus,
  FinishPuzzleCommand,
  OpenPuzlogTabCommand,
  ResumePuzzleCommand,
  UpdatePuzzleStatusIconCommand,
} from "./lib/extensionMessages";
import { PuzzleStatus } from "./lib/puzzle";

//  TODO: at this point we could actually scan each tab and see if it has a
//  loaded puzlog content script and then reload it, based on options for the
//  extension.

//  Instantiate a puzzle repository.
const puzzleRepository = new PuzzleRepository();

extensionInterface.onMessage(
  "OpenPuzlogTab",
  async (tabId, message: OpenPuzlogTabCommand) => {
    extensionInterface.navigateToPuzlogInterface(message.puzzleId);
  }
);

extensionInterface.onMessage("start", async (tabId) => {
  if (!tabId) {
    console.error(
      "puzlog: error - cannot call 'start' without providing tabId"
    );
    return;
  }
  ContentScriptInterface.start(tabId);
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
  async (tabId, message: ResumePuzzleCommand) => {
    //  Update the puzzle into a started state.
    const now = new Date();
    await puzzleRepository.update(message.puzzleId, {
      timeLastAccess: now.toISOString(),
      timeFinish: null,
      status: PuzzleStatus[PuzzleStatus.Started],
    });
  }
);

extensionInterface.onMessage(
  "UpdatePuzzleStatusIcon",
  async (tabId, message: UpdatePuzzleStatusIconCommand) => {
    if (tabId === null) {
      console.warn(
        "puzlog: 'UpdatePuzzleStatusIcon' sent without tab id, this means part of the extension is sending a message incorrectly"
      );
      return;
    }
    updateActionIconPuzzleStatus(tabId, message.puzzleStatus);
  }
);

//  When a tab changes, we want to update the icon based on what the crossword
//  state is. This means we'll need to send a message to the content script
//  telling it to update the icon (if it is loaded).
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  try {
    const tab = await chrome.tabs.get(tabId);
    //  Don't try and interact with internal / chrome tabs.
    if (!isExtensionAccessibleTab(tab.url)) {
      return;
    }
    await updateIcon(tabId);
  } catch (error) {
    console.warn(
      `puzlog: an error occured checking extension status for tab id ${tabId}`,
      error
    );
  }
});

//listen for current tab to be changed
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  //  Don't try and interact with internal / chrome tabs.
  if (!isExtensionAccessibleTab(tab.url)) {
    return;
  }
  await updateIcon(tabId);
});

//  Set the varient of the action icon.
//  Note that the variant names are restricted based on the actual icon images
//  available in the ./src/images folder.
type ActionIconVariantNames =
  | ""
  | "-start"
  | "-start-unknown"
  | "-started"
  | "-stopped"
  | "-finished"
  | "-unknown";
function setActionIcon(tabId: number, variant: ActionIconVariantNames) {
  chrome.action.setIcon({
    path: {
      "16": `images/icon16${variant}.png`,
      "32": `images/icon32${variant}.png`,
      "128": `images/icon128${variant}.png`,
    },
    tabId,
  });
}

async function updateIcon(tabId: number) {
  //  We will only update the icon on loaded pages. Anything else gets the
  //  vanilla icon.
  const contentScriptStatus =
    await ContentScriptInterface.getContentScriptStatus(tabId);
  if (contentScriptStatus !== ContentScriptStatus.Loaded) {
    setActionIcon(tabId, "");
    return;
  }

  //  We have a loaded content script so can safely get puzzle status.
  const tabStatus = await ContentScriptInterface.getTabPuzzleStatus(tabId);

  //  If the crossword hasn't been started, the icon will differentiate between
  //  whether there is crossword metadata found or not.
  if (
    tabStatus.status === PuzzleStatus.NotStarted &&
    tabStatus.crosswordMetadata
  ) {
    setActionIcon(
      tabId,
      tabStatus.crosswordMetadata ? "-start" : "-start-unknown"
    );
  } else {
    updateActionIconPuzzleStatus(tabId, tabStatus.status);
  }
}

function updateActionIconPuzzleStatus(
  tabId: number,
  puzzleStatus: PuzzleStatus
) {
  //  This function can only handle changes to a puzzle, such as starting
  //  or stopping - it cannot be be used to set the 'NotStarted' status
  //  as that icon has two variants - one for if there is series metadata
  //  found and another if there is not.
  switch (puzzleStatus) {
    case PuzzleStatus.NotStarted:
      //  Note this is a deliberate no-op.
      break;
    case PuzzleStatus.Started:
      setActionIcon(tabId, "-started");
      break;
    case PuzzleStatus.Finished:
      setActionIcon(tabId, "-finished");
      break;
    case PuzzleStatus.Unknown:
    default:
      setActionIcon(tabId, "-unknown");
      break;
  }
}
