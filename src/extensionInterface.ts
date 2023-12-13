import { PuzzleState, TimerState, fromSerializableObject } from "./puzzleState";

export function navigateToPuzlogInterface() {
  //  Navigate to the puzlog index.
  chrome.tabs.create({
    url: chrome.runtime.getURL("puzlog.html"),
  });
}

export async function loadPuzzles(): Promise<PuzzleState[]> {
  const puzzleStorage = await chrome.storage.local.get(null);

  //  Go through each storage key and find the puzzles.
  const puzzleStorageKey = "puzlog:"; // TODO prefer "puzlog:puzzle:"
  const puzzleStorageKeys = Object.keys(puzzleStorage);
  const puzzles = puzzleStorageKeys
    .filter((key) => key.startsWith(puzzleStorageKey))
    .map((key) => fromSerializableObject(puzzleStorage[key]));

  return puzzles;
}

export async function deletePuzzle(storageKey: string): Promise<void> {
  await chrome.storage.local.remove([storageKey]);
}

export function setIconTimerState(timerState: TimerState, tabId: number): void {
  console.log(`bailling on changing icon...`);
  return;
  switch (timerState) {
    case TimerState.Stopped:
      // chrome.browserAction.setBadgeBackgroundColor({ color: "#0000FF" });
      // chrome.browserAction.setBadgeText({ text: "Play" });
      chrome.action.setIcon({
        path: {
          "16": "images/icon16-stopped.png",
          "32": "images/icon32-stopped.png",
          "128": "images/icon128-stopped.png",
        },
        //        tabId,
      });
    case TimerState.Started:
      // chrome.browserAction.setBadgeText({ text: "Stop" });
      chrome.action.setIcon({
        path: {
          "16": "images/icon16-started.png",
          "32": "images/icon32-started.png",
          "128": "images/icon128-started.png",
        },
        // tabId,
      });
    // default:
    // chrome.browserAction.setBadgeBackgroundColor({ color: "#0000FF" });
    // chrome.browserAction.setBadgeText({ text: "" });
  }
}

export async function getCurrentTabId(): Promise<number> {
  const [currentTab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });
  const id = currentTab.id;
  if (id === undefined) {
    throw new Error(`unable to identify current tab`);
  }
  return id;
}
