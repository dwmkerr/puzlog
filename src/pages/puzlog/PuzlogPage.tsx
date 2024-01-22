import React, { useEffect, useState } from "react";
import Button from "@mui/joy/Button";
import Input from "@mui/joy/Input";
import Box from "@mui/joy/Box";
import Sync from "@mui/icons-material/Sync";
import SearchIcon from "@mui/icons-material/Search";
import { PuzzleState } from "../../lib/puzzleState";
import { PuzzleRepository } from "../../lib/PuzzleRepository";
import PuzzleGrid from "./PuzzleGrid";
import Header from "../../components/Header";
import { Typography } from "@mui/joy";

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
  const [searchText, setSearchText] = useState("");
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
          setSearchText(
            selectedPuzzle?.metadata?.title || selectedPuzzle?.title || ""
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
        display: "flex",
        flexDirection: "column",
        flexGrow: 1,
      }}
    >
      <Header onBackup={backup} onRestoreComplete={restore} />
      <Box
        sx={{
          p: 2 /* padding of 2 */,
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
        }}
      >
        <Typography level="h3" component="h1">
          Puzzles
        </Typography>
        <Box
          sx={{
            display: "flex",
            gap: 2,
            flexWrap: "wrap",
            paddingBottom: "20px",
          }}
        >
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
        <Box
          sx={{
            display: "flex",
            gap: 2,
            flexWrap: "wrap",
            paddingBottom: "20px",
          }}
        >
          <Input
            startDecorator={<SearchIcon />}
            placeholder="Search"
            value={searchText}
            autoFocus
            sx={{ width: 480 }}
            size="sm"
            onChange={(e) => setSearchText(e.target.value)}
          />
        </Box>
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
