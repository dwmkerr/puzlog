import { storageKeyFromPuzzleId } from "../helpers";
import { loginWithGoogleOAuth2 } from "./firebase";
import {
  PuzzleState,
  toSerializableObject,
  fromSerializableObject,
} from "./puzzleState";

export interface ExtensionUser {
  uid: string;
  displayName: string | null;
  email: string | null;
}

export class PuzzleRepository {
  private storage: chrome.storage.StorageArea;

  constructor(storage: chrome.storage.StorageArea) {
    this.storage = storage;
  }

  async load(): Promise<PuzzleState[]> {
    const puzzleStorage = await this.storage.get(null);

    //  Go through each storage key and find the puzzles.
    const puzzleStorageKey = "puzlog:"; // TODO prefer "puzlog:puzzle:"
    const puzzleStorageKeys = Object.keys(puzzleStorage);
    const puzzles = puzzleStorageKeys
      .filter((key) => key.startsWith(puzzleStorageKey))
      .map((key) => fromSerializableObject(puzzleStorage[key]));

    return puzzles;
  }

  async loadPuzzle(puzzleId: string): Promise<PuzzleState | null> {
    const storageKey = storageKeyFromPuzzleId(puzzleId);
    const storage = await this.storage.get(storageKey);
    const storageObject = storage[storageKey];
    if (!storageObject) {
      return null;
    }
    const storedPuzzleState = fromSerializableObject(storageObject);
    return storedPuzzleState;
  }

  async delete(storageKey: string): Promise<void> {
    await this.storage.remove([storageKey]);
  }

  async save(puzzle: PuzzleState): Promise<void> {
    //  Create a serializable version of the state. Then create the payload to
    //  add to the local storage.
    const serializableState = toSerializableObject(puzzle);
    const items = {
      [puzzle.storageKey]: serializableState,
    };

    //  Save the payload, check for errors, throw if needed.
    await this.storage.set(items);
    if (chrome.runtime.lastError) {
      throw new Error(
        `error setting state to '${puzzle.storageKey}': ${chrome.runtime.lastError.message}`
      );
    }
  }

  async restore(backupJson: string): Promise<void> {
    const puzzleRecords = JSON.parse(backupJson) as Record<
      string,
      string | number | null
    >[];
    debugger; // TODO for now paste in records from the console
    const savePromises = puzzleRecords.map((puzzleRecord) => {
      const puzzle = fromSerializableObject(puzzleRecord);
      return this.save(puzzle);
    });
    await Promise.all(savePromises);
  }

  async backup(): Promise<string> {
    const puzzles = await this.load();
    const puzzlesSerializable = puzzles.map((puzzle) =>
      toSerializableObject(puzzle)
    );
    const backupJson = JSON.stringify(puzzlesSerializable, null, 2);
    return backupJson;
  }

  async isLoggedIn(): Promise<boolean> {
    const extensionUser = await this.storage.get("extensionUser");
    return extensionUser !== null;
  }

  async getExtensionUser(): Promise<ExtensionUser | null> {
    const extensionUser = await this.storage.get("extensionUser");
    return extensionUser as ExtensionUser;
  }

  async logout(): Promise<void> {
    await this.storage.remove("extensionUser");
  }

  // Login with Google using Firebase popup
  async loginWithGooglePopup(): Promise<ExtensionUser | null> {
    //  TODO extract chrome
    try {
      const result = await chrome.identity.getAuthToken({ interactive: true });
      const { token } = result;
      if (!token) {
        return null;
      }
      const user = await loginWithGoogleOAuth2(token);
      if (!user) {
        return null;
      }
      const extensionUser: ExtensionUser = {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
      };

      await this.storage.set({ extensionUser });
      return extensionUser;
    } catch (err) {
      console.log(err);
      return null;
    }
  }
}
