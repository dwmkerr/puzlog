import { Puzzle, PuzzleStatus } from "./puzzle";
import * as extensionInterface from "../extensionInterface";
import { CrosswordMetadata } from "./crossword-metadata/CrosswordMetadataProvider";

export interface StateUpdatedCommand {
  puzzleState: Puzzle;
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
  crosswordMetadata: Partial<CrosswordMetadata>;
}

export interface UpdatePuzzleStatusIconCommand {
  puzzleStatus: PuzzleStatus;
}

export type ExtensionMessageNameMap = {
  //  Service worker messages.
  ["start"]: null;
  ["finish"]: FinishPuzzleCommand;
  ["resume"]: ResumePuzzleCommand;

  ["stateUpdated"]: StateUpdatedCommand;
  ["getTabPuzzleStatus"]: null;
  ["startTabPuzzle"]: object;
  ["OpenPuzlogTab"]: OpenPuzlogTabCommand;
  ["UpdatePuzzleStatusIcon"]: UpdatePuzzleStatusIconCommand;
};

export enum ContentScriptStatus {
  NotPresent,
  Loading,
  Loaded,
  Errored,
  OutOfDate,
  Unknown,
}

export abstract class ServiceWorkerInterface {
  public static async start(): Promise<void> {
    await extensionInterface.sendRuntimeMessage("start", null);
  }

  public static async resumePuzzle(puzzleId: string): Promise<void> {
    await extensionInterface.sendRuntimeMessage("resume", {
      puzzleId,
    });
  }

  public static async finishPuzzle(puzzleId: string): Promise<void> {
    await extensionInterface.sendRuntimeMessage("finish", {
      puzzleId,
    });
  }

  //  Called from the content script when the puzzle status changes so that the
  //  extension action icon can be kept up to date.
  public static async updatePuzzleStatusIcon(
    puzzleStatus: PuzzleStatus
  ): Promise<void> {
    return await extensionInterface.sendRuntimeMessage(
      "UpdatePuzzleStatusIcon",
      { puzzleStatus }
    );
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

    //  The result has been serialized for transport so we need to deserialize
    //  if for things like the date to work.
    const tabPuzzleData: TabPuzzleData = {
      puzzleId: result.puzzleId || null,
      status: result.status as PuzzleStatus,
      crosswordMetadata: {
        series: result?.crosswordMetadata?.series,
        title: result?.crosswordMetadata?.title,
        setter: result?.crosswordMetadata?.setter,
        datePublished: result?.crosswordMetadata?.datePublished
          ? new Date(result.crosswordMetadata.datePublished as string)
          : undefined,
      },
    };
    return tabPuzzleData;
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
        } else if (contentScriptStatus === "errored") {
          return "Errored";
        } else {
          return "Unknown";
        }
      },
    });

    return ContentScriptStatus[
      status.result as keyof typeof ContentScriptStatus
    ];
  }

  public static async start(tabId: number): Promise<void> {
    await extensionInterface.sendTabMessage("startTabPuzzle", tabId, {});
  }
}
