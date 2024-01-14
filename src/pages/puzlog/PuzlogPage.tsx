import React, { useEffect, useState } from "react";
import Button from "@mui/joy/Button";
import Box from "@mui/joy/Box";
import Sync from "@mui/icons-material/Sync";
import Google from "@mui/icons-material/Sync";
import Download from "@mui/icons-material/Download";
import Upload from "@mui/icons-material/Upload";
import { PuzzleState } from "../../lib/puzzleState";
import { ExtensionUser, PuzzleRepository } from "../../lib/PuzzleRepository";
import PuzzleGrid from "./PuzzleGrid";
import { storageKeyFromPuzzleId } from "../../helpers";

interface PuzlogPageProps {
  puzzleRepository: PuzzleRepository;
}

const PuzlogPage = ({ puzzleRepository }: PuzlogPageProps) => {
  // State to store the array of puzzles
  const [puzzles, setPuzzles] = useState<PuzzleState[]>([]);
  const [user, setUser] = useState<ExtensionUser | null>(null);

  useEffect(() => {
    // Define your async function
    const getPuzzles = async () => {
      try {
        // Perform your async operation to get puzzles
        const puzzles = await puzzleRepository.load();
        setPuzzles(puzzles);
      } catch (error) {
        console.error("puzlog: error getting puzzles", error);
      }
    };

    // Call the async function on component mount
    getPuzzles();
  }, []); // Empty dependency array ensures this effect runs only once on mount

  useEffect(() => {
    const getUser = async () => {
      const user = await puzzleRepository.getExtensionUser();
      setUser(user);
    };
    getUser();
  }, []);

  const downloadPuzzles = async (puzzles: PuzzleState[], filename: string) => {
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
  const restore = async () => {
    const content = "[]"; // todo load from file
    await puzzleRepository.restore(content);
  };
  const login = async () => {
    const user = await puzzleRepository.loginWithGooglePopup();
    setUser(user);
  };

  return (
    <div
      style={{
        padding: "1em",
        display: "flex",
        flexDirection: "column",
        flexGrow: 1,
      }}
    >
      <h1>Puzlog</h1>
      <Box
        sx={{
          display: "flex",
          gap: 2,
          flexWrap: "wrap",
          paddingBottom: "20px",
        }}
      >
        <Button
          startDecorator={<Download />}
          variant="outlined"
          size="sm"
          onClick={backup}
        >
          Download
        </Button>
        <Button
          startDecorator={<Upload />}
          variant="outlined"
          size="sm"
          onClick={restore}
        >
          Restore
        </Button>
        <Button startDecorator={<Sync />} variant="outlined" size="sm">
          Sync
        </Button>
        {user ? (
          <Button
            startDecorator={<Google />}
            variant="outlined"
            size="sm"
            onClick={login}
          >
            Login
          </Button>
        ) : (
          <p>{JSON.stringify(user)}</p>
        )}
      </Box>

      <PuzzleGrid
        puzzles={puzzles}
        updatePuzzle={async (puzzle) => await puzzleRepository.save(puzzle)}
        deletePuzzle={async (puzzleId) =>
          await puzzleRepository.delete(storageKeyFromPuzzleId(puzzleId))
        }
        style={{ width: "100%", flexGrow: 1 }}
      />
    </div>
  );
};

export default PuzlogPage;
