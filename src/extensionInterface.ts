import { ExtensionMessageNameMap } from "./lib/extensionMessages";
import { storageKeyFromPuzzleId } from "./helpers";
import {
  PuzzleState,
  toSerializableObject,
  fromSerializableObject,
} from "./lib/puzzleState";

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

export async function loadPuzzle(
  puzzleId: string
): Promise<PuzzleState | null> {
  const storageKey = storageKeyFromPuzzleId(puzzleId);
  const storage = await chrome.storage.local.get(storageKey);
  const storageObject = storage[storageKey];
  if (!storageObject) {
    return null;
  }
  const storedPuzzleState = fromSerializableObject(storageObject);
  return storedPuzzleState;
}

export async function deletePuzzle(storageKey: string): Promise<void> {
  await chrome.storage.local.remove([storageKey]);
}

export async function savePuzzle(puzzle: PuzzleState): Promise<void> {
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
}

// export function setIconTimerState(timerState: TimerState, tabId: number): void {
//   console.log(`bailing on changing icon for tab ${tabId}...`);
//   return;
//   switch (timerState) {
//     case TimerState.Stopped:
//       // chrome.browserAction.setBadgeBackgroundColor({ color: "#0000FF" });
//       // chrome.browserAction.setBadgeText({ text: "Play" });
//       chrome.action.setIcon({
//         path: {
//           "16": "images/icon16-stopped.png",
//           "32": "images/icon32-stopped.png",
//           "128": "images/icon128-stopped.png",
//         },
//         //        tabId,
//       });
//     case TimerState.Started:
//       // chrome.browserAction.setBadgeText({ text: "Stop" });
//       chrome.action.setIcon({
//         path: {
//           "16": "images/icon16-started.png",
//           "32": "images/icon32-started.png",
//           "128": "images/icon128-started.png",
//         },
//         // tabId,
//       });
//     // default:
//     // chrome.browserAction.setBadgeBackgroundColor({ color: "#0000FF" });
//     // chrome.browserAction.setBadgeText({ text: "" });
//   }
// }

export async function getCurrentTabId(): Promise<number> {
  const [currentTab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });
  const id = currentTab.id;
  if (id === undefined) {
    throw new Error(`unable to identify current tab`);
  }
  return id;
}

export async function sendRuntimeMessage<
  K extends keyof ExtensionMessageNameMap
>(messageName: K, message: ExtensionMessageNameMap[K]) {
  const response = await chrome.runtime.sendMessage({
    ...message,
    command: messageName,
  });
  return response;
}

export async function sendTabMessage<K extends keyof ExtensionMessageNameMap>(
  messageName: K,
  tabId: number,
  message: ExtensionMessageNameMap[K]
) {
  const response = await chrome.tabs.sendMessage(tabId, {
    ...message,
    command: messageName,
  });
  return response;
}

export function onMessage<K extends keyof ExtensionMessageNameMap>(
  messageName: K,
  handler: (
    tabId: number | null,
    message: ExtensionMessageNameMap[K]
  ) => Promise<object | void>
): void {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const tabId = sender.tab?.id || null;
    const source = tabId ? `Tab ${tabId}` : "Extension";
    const command = request.command || "<unknown>";
    const log = `recieved command '${command}' from ${source}`;
    console.log(log);
    if (command === messageName) {
      handler(tabId, request as ExtensionMessageNameMap[K])
        .then((response) => {
          sendResponse(response);
        })
        .catch((err) => {
          console.error("Failed to send response", tabId, source, command);
          throw err;
        });
      // Important! Return true to indicate you want to send a response asynchronously
      return true;
    }
    return false; // nothing to send...
  });
}
