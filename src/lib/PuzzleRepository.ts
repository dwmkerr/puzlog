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
  PuzzleState,
  toSerializableObject,
  fromSerializableObject,
  SerializablePuzzle,
} from "./puzzleState";
import { Auth, Unsubscribe, User, signInAnonymously } from "firebase/auth";
import { PuzlogError } from "./PuzlogError";

const puzzleConverter = {
  toFirestore(puzzle: WithFieldValue<PuzzleState>): SerializablePuzzle {
    return toSerializableObject(puzzle as PuzzleState);
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): PuzzleState {
    const data = snapshot.data(options) as SerializablePuzzle;
    return fromSerializableObject(data);
  },
};

export class PuzzleRepository {
  private puzzlesCollection: CollectionReference<
    PuzzleState,
    SerializablePuzzle
  >;

  private auth: Auth;

  constructor() {
    const { db, auth } = PuzlogFirebase.get();
    this.auth = auth;
    this.puzzlesCollection = collection(db, "puzzles").withConverter(
      puzzleConverter
    );
  }

  async load(): Promise<PuzzleState[]> {
    const querySnapshot = await getDocs(this.puzzlesCollection);
    const puzzles = querySnapshot.docs.map((doc) => doc.data());
    return puzzles;
  }

  subscribeToPuzzles(onPuzzles: (puzzles: PuzzleState[]) => void): Unsubscribe {
    const q = query(this.puzzlesCollection);
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const puzzles = querySnapshot.docs.map((doc) => doc.data());
      onPuzzles(puzzles);
    });
    return unsubscribe;
  }

  async loadPuzzle(id: string): Promise<PuzzleState | null> {
    const docRef = doc(this.puzzlesCollection, id);
    const puzzle = (await getDoc(docRef)).data();
    return puzzle || null;
  }

  async queryPuzzleByUrl(url: string): Promise<PuzzleState | null> {
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

  async create(puzzleWithoutId: Omit<PuzzleState, "id">): Promise<PuzzleState> {
    //  Create the document ID before we store the document - because we
    //  actually use the document ID as the puzzle id.
    const newDocumentReference = doc(this.puzzlesCollection);
    const puzzle: PuzzleState = {
      ...puzzleWithoutId,
      id: newDocumentReference.id,
    };

    //  Store in firebase and we're done.
    await setDoc(newDocumentReference, puzzle);
    return puzzle;
  }

  async save(puzzle: PuzzleState): Promise<void> {
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
    onChange: (puzzle: PuzzleState) => void
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

  async signInAnonymously(): Promise<User> {
    try {
      const userCredential = await signInAnonymously(this.auth);
      return userCredential.user;
      // eslint-disable-next-line
    } catch (err: any) {
      throw new PuzlogError("Authentication Failed", err?.message, err);
    }
  }
}
