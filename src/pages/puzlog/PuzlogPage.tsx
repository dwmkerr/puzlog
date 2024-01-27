import React, { useEffect, useState } from "react";
import Box from "@mui/joy/Box";
import { Puzzle } from "../../lib/puzzle";
import { PuzzleRepository } from "../../lib/PuzzleRepository";
import PuzzleGrid from "./PuzzleGrid";
import Header from "../../components/Header";
import { Typography } from "@mui/joy";
import { User, onAuthStateChanged } from "firebase/auth";
import ErrorSnackbar from "../../components/ErrorSnackbar";
import { PuzlogError, WarningError } from "../../lib/Errors";
import WarningSnackbar from "../../components/WarningSnackbar";

interface PuzlogPageProps {
  puzzleRepository: PuzzleRepository;
  selectedPuzzleId: string | null;
}

const PuzlogPage = ({
  puzzleRepository,
  selectedPuzzleId,
}: PuzlogPageProps) => {
  const [user, setUser] = useState<User | null>(puzzleRepository.getUser());
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [searchText, setSearchText] = useState("");
  const [currentError, setCurrentError] = useState<PuzlogError | undefined>(
    undefined
  );
  const [currentWarning, setCurrentWarning] = useState<
    WarningError | undefined
  >(undefined);

  useEffect(() => {
    //  If the user is not signed in at all, show an error.
    if (!user) {
      setCurrentWarning(
        new WarningError(
          "Not Signed In",
          "You are not signed in and puzzle progress cannot be saved. Create a Guest account or Sign In to start."
        )
      );
    }

    //  If the user is not signed in, set the warning state.
    if (user && user?.isAnonymous) {
      setCurrentWarning(
        new WarningError(
          "Guest Account Warning",
          "Guest accounts do not have their puzzles backed up - link a social account to backup your puzzles."
        )
      );
    }
  }, [user]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      puzzleRepository.getAuth(),
      (user) => {
        setUser(user || null);
      }
    );

    return () => unsubscribe();
  }, []);

  //  On load, try to log in anonymously.
  // useEffect(() => {
  //   const loginAnon = async () => {
  //     const auth = puzzleRepository.getAuth();
  //     try {
  //       const userCredential = await signInAnonymously(auth);
  //       setUser(userCredential.user);
  //       setCurrentWarning(
  //         new WarningError(
  //           "Guest Account Warning",
  //           "Guest accounts do not have their puzzles backed up - link a social account to backup your puzzles."
  //         )
  //       );
  //       // eslint-disable-next-line
  //     } catch (err: any) {
  //       setCurrentError(
  //         new PuzlogError(
  //           "Authentication Failed",
  //           err?.message ||
  //             "An unknown error occurred attemping to authenticate anonymously.",
  //           err
  //         )
  //       );
  //     }
  //   };
  //   loginAnon();
  // }, []);

  //  On mount, watch for any changes to the puzzles collection and then update
  //  the puzzles appropriately.
  useEffect(() => {
    const unsubscribe = puzzleRepository.subscribeToPuzzles((puzzles) => {
      setPuzzles(puzzles);
      if (selectedPuzzleId) {
        const selectedPuzzle = puzzles.find((p) => p.id === selectedPuzzleId);
        setSearchText(
          selectedPuzzle?.metadata?.title || selectedPuzzle?.title || ""
        );
      }
    });
    return unsubscribe;
  }, []); // Empty dependency array ensures this effect runs only once on mount

  const downloadPuzzles = async (puzzles: Puzzle[], filename: string) => {
    // Create a Blob from the JSON data
    const puzzlesJson = await puzzleRepository.backup();
    const blob = new Blob([puzzlesJson], {
      type: "application/json",
    });

    //  Create the link, download the content, clean up.
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const backup = () => downloadPuzzles(puzzles, "puzzles.json");
  const restore = async (fileContents: string) => {
    //  If we don't have a user, we are going to have to fail.
    if (!user?.uid) {
      throw new PuzlogError(
        "Restore Error",
        "Cannot restore puzzles as the user is not logged in."
      );
    }
    await puzzleRepository.restore(fileContents, user.uid);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flexGrow: 1,
      }}
    >
      <Header
        onBackup={backup}
        onRestoreComplete={restore}
        searchText={searchText}
        onSearchTextChanged={setSearchText}
      />
      <Box
        sx={{
          p: 2 /* padding of 2 */,
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
        }}
      >
        <ErrorSnackbar
          error={currentError}
          onDismiss={() => setCurrentError(undefined)}
        />
        <WarningSnackbar
          warning={currentWarning}
          onDismiss={() => setCurrentWarning(undefined)}
        />
        <Typography level="h3" component="h1">
          Puzzles
        </Typography>
        <PuzzleGrid
          puzzles={puzzles}
          updatePuzzle={async (puzzle) => await puzzleRepository.save(puzzle)}
          deletePuzzle={async (puzzleId) =>
            await puzzleRepository.delete(puzzleId)
          }
          quickFilterText={searchText}
          style={{ width: "100%", flexGrow: 1 }}
        />
      </Box>
    </div>
  );
};

export default PuzlogPage;
