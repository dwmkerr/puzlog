import { PuzzleState } from "./puzzleState";

export interface StateUpdatedCommand {
  puzzleState: PuzzleState;
}

export interface TabCommand {
  tabId: number;
}

export interface TabStateUpdatedCommand extends TabCommand {
  puzzleState: PuzzleState;
}

export interface StartPuzzleCommand {
  puzzleId: string;
}

export interface FinishPuzzleCommand {
  puzzleId: string;
}

export type ExtensionMessageNameMap = {
  ["start"]: StartPuzzleCommand;
  ["finish"]: FinishPuzzleCommand;
  ["stateUpdated"]: StateUpdatedCommand;
  ["tabStateUpdated"]: TabStateUpdatedCommand;
};
