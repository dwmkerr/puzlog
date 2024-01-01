import { PuzzleState } from "./puzzleState";

export interface StateUpdatedCommand {
  puzzleState: PuzzleState;
}

export interface TabCommand {
  tabId: number;
}

export interface StartPuzzleCommand {
  puzzleId: string;
  url: string;
  title: string;
}

export interface FinishPuzzleCommand {
  puzzleId: string;
}

export interface OpenPuzlogTabCommand {
  puzzleId: string;
}

export interface UpdatePuzzleCommand {
  puzzleId: string;
  updatedValues: Partial<PuzzleState>;
}

export type ExtensionMessageNameMap = {
  ["start"]: StartPuzzleCommand;
  ["finish"]: FinishPuzzleCommand;
  ["stateUpdated"]: StateUpdatedCommand;
  ["getTabPuzzleStatus"]: object;
  ["startTabPuzzle"]: object;
  ["OpenPuzlogTab"]: OpenPuzlogTabCommand;
  ["UpdatePuzzle"]: UpdatePuzzleCommand;
};
