import { PuzzleState, fromSerializableObject } from "./puzzleState";

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
