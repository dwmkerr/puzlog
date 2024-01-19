import React, { useEffect, useState } from "react";
import Button from "@mui/joy/Button";
import Box from "@mui/joy/Box";
import Sync from "@mui/icons-material/Sync";
// import Google from "@mui/icons-material/Sync";
import Download from "@mui/icons-material/Download";
import Upload from "@mui/icons-material/Upload";
import { PuzzleState } from "../../lib/puzzleState";
import { PuzzleRepository } from "../../lib/PuzzleRepository";
import PuzzleGrid from "./PuzzleGrid";
import FileUploadButton from "../../components/FileUploadButton";

interface PuzlogPageProps {
  puzzleRepository: PuzzleRepository;
  selectedPuzzleId: string | null;
}

const PuzlogPage = ({
  puzzleRepository,
  selectedPuzzleId,
}: PuzlogPageProps) => {
  // State to store the array of puzzles
  const [puzzles, setPuzzles] = useState<PuzzleState[]>([]);
  const [puzzleTitleFilter, setPuzzleTitleFilter] = useState<string | null>(
    null
  );
  // const [user, setUser] = useState<ExtensionUser | null>(null);

  useEffect(() => {
    // Define your async function
    const getPuzzles = async () => {
      try {
        //  Get the puzzles. If we have a selected puzzle id, we can also
        //  get the title of the puzzle to filter to.
        const puzzles = await puzzleRepository.load();
        setPuzzles(puzzles);
        if (selectedPuzzleId) {
          const selectedPuzzle = puzzles.find((p) => p.id === selectedPuzzleId);
          setPuzzleTitleFilter(
            selectedPuzzle?.metadata?.title || selectedPuzzle?.title || null
          );
        }
      } catch (error) {
        console.error("puzlog: error getting puzzles", error);
      }
    };

    // Call the async function on component mount
    getPuzzles();
  }, []); // Empty dependency array ensures this effect runs only once on mount

  // TODO bring back the user...
  // useEffect(() => {
  //   const getUser = async () => {
  //     const user = await puzzleRepository.getExtensionUser();
  //     setUser(user);
  //   };
  //   getUser();
  // }, []);

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
  const restore = async (fileContents: string) => {
    await puzzleRepository.restore(fileContents);
  };
  // TODO bring it back
  // const login = async () => {
  //   const user = await puzzleRepository.loginWithGooglePopup();
  //   setUser(user);
  // };

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
        <FileUploadButton
          startDecorator={<Upload />}
          variant="outlined"
          size="sm"
          onFileUploadComplete={restore}
        />
        <Button startDecorator={<Sync />} variant="outlined" size="sm">
          Sync
        </Button>
        {/*user ? (
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
          )*/}
      </Box>

      <PuzzleGrid
        puzzles={puzzles}
        initialPuzzleTitleFilter={puzzleTitleFilter}
        updatePuzzle={async (puzzle) => await puzzleRepository.save(puzzle)}
        deletePuzzle={async (puzzleId) =>
          await puzzleRepository.delete(puzzleId)
        }
        style={{ width: "100%", flexGrow: 1 }}
      />
    </div>
  );
};

export default PuzlogPage;
