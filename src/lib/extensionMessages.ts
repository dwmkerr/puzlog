import { CrosswordMetadata } from "./crossword-metadata";
import { PuzzleState, PuzzleStatus } from "./puzzleState";
import * as extensionInterface from "../extensionInterface";

export interface StateUpdatedCommand {
  puzzleState: PuzzleState;
}

export interface TabCommand {
  tabId: number;
}

export interface FinishPuzzleCommand {
  puzzleId: string;
}

export interface ResumePuzzleCommand {
  puzzleId: string;
}

export interface OpenPuzlogTabCommand {
  puzzleId: string;
}

export interface TabPuzzleData {
  puzzleId: string;
  status: PuzzleStatus;
  crosswordMetadata: CrosswordMetadata | null;
}

export type ExtensionMessageNameMap = {
  ["finish"]: FinishPuzzleCommand;
  ["resume"]: ResumePuzzleCommand;
  ["stateUpdated"]: StateUpdatedCommand;
  ["getTabPuzzleStatus"]: null;
  ["startTabPuzzle"]: object;
  ["OpenPuzlogTab"]: OpenPuzlogTabCommand;
};

export enum ContentScriptStatus {
  NotPresent,
  Loading,
  Loaded,
  OutOfDate,
  Unknown,
}

export abstract class ServiceWorkerInterface {
  public static async finishPuzzle(puzzleId: string): Promise<void> {
    await extensionInterface.sendRuntimeMessage("finish", {
      puzzleId,
    });
  }

  public static async resumePuzzle(puzzleId: string): Promise<void> {
    await extensionInterface.sendRuntimeMessage("resume", {
      puzzleId,
    });
  }
}

export abstract class ContentScriptInterface {
  public static async getTabPuzzleStatus(
    tabId: number
  ): Promise<TabPuzzleData> {
    const result = await extensionInterface.sendTabMessage(
      "getTabPuzzleStatus",
      tabId,
      null
    );
    return result as TabPuzzleData;
  }

  public static async getContentScriptStatus(
    tabId: number
  ): Promise<ContentScriptStatus> {
    const [status] = await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: function () {
        console.log(`starting script...`);
        const contentScriptStatusTag = document.querySelector(
          'meta[name="puzlog-content-script-status"]'
        );
        if (!contentScriptStatusTag) {
          return "NotPresent";
        }
        const contentScriptStatus =
          contentScriptStatusTag.getAttribute("content");
        if (contentScriptStatus === "loading") {
          return "Loading";
        } else if (contentScriptStatus === "loaded") {
          return "Loaded";
        } else {
          return "Unknown";
        }
      },
    });

    return ContentScriptStatus[
      status.result as keyof typeof ContentScriptStatus
    ];
  }
}
