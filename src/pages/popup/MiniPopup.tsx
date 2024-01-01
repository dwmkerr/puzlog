import React from "react";
import * as extensionInterface from "../../extensionInterface";

const MiniPopup = () => {
  const start = async () => {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    const tabId = tab?.id;
    if (!tabId) {
      throw new Error(
        "Cannot find the current tab id - maybe a permissions issue?"
      );
    }
    const { puzzleId } = await extensionInterface.sendTabMessage(
      "getTabPuzzleStatus",
      tabId,
      {}
    );

    if (puzzleId) {
      extensionInterface.sendTabMessage("startTabPuzzle", tabId, {
        puzzleId: puzzleId,
      });
    }
  };

  const goToPuzlog = () => {
    extensionInterface.navigateToPuzlogInterface();
  };

  return (
    <div>
      <div style={{ fontSize: "1.2em", marginBottom: "0.5em" }}>
        <a id="puzlog_title" onClick={goToPuzlog}>
          Puzlog
        </a>
      </div>
      <div id="controls">
        <button onClick={start}>Start</button>
      </div>
    </div>
  );
};

export default MiniPopup;
