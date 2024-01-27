import {
  collection,
  onSnapshot,
  doc,
  getDocs,
  CollectionReference,
  WithFieldValue,
  QueryDocumentSnapshot,
  SnapshotOptions,
  setDoc,
  getDoc,
  deleteDoc,
  query,
  where,
  updateDoc,
} from "firebase/firestore";
import { PuzlogFirebase } from "./firebase";
import {
  Puzzle,
  toSerializableObject,
  fromSerializableObject,
  SerializablePuzzle,
} from "./puzzle";
import {
  Auth,
  GoogleAuthProvider,
  Unsubscribe,
  User,
  signInAnonymously,
  signInWithCredential,
  linkWithCredential,
} from "firebase/auth";
import { PuzlogError } from "./Errors";

const puzzleConverter = {
  toFirestore(puzzle: WithFieldValue<Puzzle>): SerializablePuzzle {
    return toSerializableObject(puzzle as Puzzle);
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): Puzzle {
    const data = snapshot.data(options) as SerializablePuzzle;
    return fromSerializableObject(data);
  },
};

export class PuzzleRepository {
  private puzzlesCollection: CollectionReference<Puzzle, SerializablePuzzle>;

  private auth: Auth;

  constructor() {
    const { db, auth } = PuzlogFirebase.get();
    this.auth = auth;
    this.puzzlesCollection = collection(db, "puzzles").withConverter(
      puzzleConverter
    );
  }

  async load(): Promise<Puzzle[]> {
    const querySnapshot = await getDocs(this.puzzlesCollection);
    const puzzles = querySnapshot.docs.map((doc) => doc.data());
    return puzzles;
  }

  subscribeToPuzzles(onPuzzles: (puzzles: Puzzle[]) => void): Unsubscribe {
    const q = query(this.puzzlesCollection);
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const puzzles = querySnapshot.docs.map((doc) => doc.data());
      onPuzzles(puzzles);
    });
    return unsubscribe;
  }

  async loadPuzzle(id: string): Promise<Puzzle | null> {
    const docRef = doc(this.puzzlesCollection, id);
    const puzzle = (await getDoc(docRef)).data();
    return puzzle || null;
  }

  async queryPuzzleByUrl(url: string): Promise<Puzzle | null> {
    const q = query(this.puzzlesCollection, where("url", "==", url));
    const querySnapshot = await getDocs(q);
    const puzzles = querySnapshot.docs.map((doc) => doc.data());
    if (puzzles.length > 1) {
      console.warn(
        "Multiple puzzles found for this url, picking first, but this represents a bug in the puzlog extension"
      );
    }
    return puzzles[0] || null;
  }

  async delete(id: string): Promise<void> {
    const docRef = doc(this.puzzlesCollection, id);
    await deleteDoc(docRef);
  }

  async create(puzzleWithoutId: Omit<Puzzle, "id">): Promise<Puzzle> {
    //  Create the document ID before we store the document - because we
    //  actually use the document ID as the puzzle id.
    const newDocumentReference = doc(this.puzzlesCollection);
    const puzzle: Puzzle = {
      ...puzzleWithoutId,
      id: newDocumentReference.id,
    };

    //  Store in firebase and we're done.
    await setDoc(newDocumentReference, puzzle);
    return puzzle;
  }

  async save(puzzle: Puzzle): Promise<void> {
    await setDoc(doc(this.puzzlesCollection, puzzle.id), puzzle);
  }

  async update(
    id: string,
    puzzleFields: Partial<SerializablePuzzle>
  ): Promise<void> {
    const docRef = doc(this.puzzlesCollection, id);
    await updateDoc(docRef, puzzleFields);
  }

  subscribeToChanges(
    id: string,
    onChange: (puzzle: Puzzle) => void
  ): Unsubscribe {
    return onSnapshot(doc(this.puzzlesCollection, id), (doc) => {
      const puzzle = doc.data();
      if (puzzle) {
        onChange(puzzle);
      }
    });
  }

  async restore(backupJson: string, userId: string): Promise<void> {
    const puzzleRecords = JSON.parse(backupJson) as SerializablePuzzle[];
    const puzzles = puzzleRecords.map(fromSerializableObject);

    //  Now write the records to firebase. Some might have an id, some might
    //  not.
    const promises = puzzles.map(async (puzzle) => {
      if (!puzzle.id) {
        const newDocumentReference = doc(this.puzzlesCollection);
        puzzle.id = newDocumentReference.id;
      }

      //  Load the puzzles into the database, but always set the user id.
      return await setDoc(doc(this.puzzlesCollection, puzzle.id), {
        ...puzzle,
        userId,
      });
    });
    await Promise.all(promises);
  }

  async backup(): Promise<string> {
    const puzzles = await this.load();
    const puzzlesSerializable = puzzles.map((puzzle) =>
      toSerializableObject(puzzle)
    );
    const backupJson = JSON.stringify(puzzlesSerializable, null, 2);
    return backupJson;
  }

  getAuth(): Auth {
    return this.auth;
  }

  getUser(): User | null {
    return this.auth.currentUser;
  }

  async signInAnonymously(): Promise<User> {
    try {
      const userCredential = await signInAnonymously(this.auth);
      return userCredential.user;
      // eslint-disable-next-line
    } catch (err: any) {
      throw new PuzlogError("Authentication Failed", err?.message, err);
    }
  }

  async signInWithGoogle(): Promise<User | null> {
    //  Get an auth token via chrome's identity api, interactive if needed.
    const { token } = await chrome.identity.getAuthToken({
      interactive: true,
      scopes: ["profile", "email"],
    });
    if (chrome.runtime.lastError) {
      throw new PuzlogError(
        "Sign In Error",
        chrome.runtime.lastError.message || "Unknown error"
      );
    }

    //  If we haven't received a token, return false.
    if (!token) {
      console.log("puzlog: sign in returned null token");
      return null;
    }

    //  Now sign in to firebase using a a google credential based on the token.
    try {
      const response = await signInWithCredential(
        this.auth,
        GoogleAuthProvider.credential(null, token)
      );
      console.log("puzlog: signed in!", response);
      return response.user;
      // eslint-disable-next-line
    } catch (err: any) {
      throw new PuzlogError("Sign In Error", err?.message, err);
    }
  }

  async linkAnonymousUserWithGoogle(currentUser: User) {
    try {
      const { token } = await chrome.identity.getAuthToken({
        interactive: true,
        scopes: ["profile", "email"],
      });
      const credential = GoogleAuthProvider.credential(null, token);

      //  Link the google account to the current anonymous user.
      const userCredential = await linkWithCredential(currentUser, credential);
      console.log("puzlog: Account linking successful:", userCredential.user);
      // eslint-disable-next-line
    } catch (err: any) {
      throw new PuzlogError("Link Account Error", err?.message, err);
    }
  }

  async signOut() {
    //  Clear the chrome cached for any signed-in identities and sing out from
    //  Firebase.
    await chrome.identity.clearAllCachedAuthTokens();
    this.auth.signOut();
  }
}
