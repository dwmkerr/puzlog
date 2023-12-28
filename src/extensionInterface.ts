import {
  PuzzleState,
  TimerState,
  toSerializableObject,
  fromSerializableObject,
} from "./lib/puzzleState";

export enum TabMessages {
  ShowOverlay = "ShowOverlay",
}

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

export async function savePuzzle(
  puzzle: PuzzleState,
  broadcastUpdate: boolean
): Promise<void> {
  //  Create a serializable version of the state. Then create the payload to
  //  add to the local storage.
  const serializableState = toSerializableObject(puzzle);
  const items = {
    [puzzle.storageKey]: serializableState,
  };

  //  Save the payload, check for errors, throw if needed.
  await chrome.storage.local.set(items);
  if (chrome.runtime.lastError) {
    throw new Error(
      `error setting state to '${puzzle.storageKey}': ${chrome.runtime.lastError.message}`
    );
  }

  //  If we have been asked to broadcast updates, then send a message to the
  //  runtime, notifying other parts of the extension that our state is updated.
  if (broadcastUpdate) {
    chrome.runtime.sendMessage({
      command: "stateUpdated",
      puzzleState: puzzle,
    });
  }
}

export function setIconTimerState(timerState: TimerState, tabId: number): void {
  console.log(`bailing on changing icon for tab ${tabId}...`);
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
