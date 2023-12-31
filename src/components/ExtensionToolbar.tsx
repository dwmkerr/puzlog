import React, { useState, useEffect } from "react";
import { FaFlagCheckered } from "react-icons/fa";
import { FaPlay } from "react-icons/fa";
import * as extensionInterface from "../extensionInterface";
import { TabStateUpdatedCommand } from "../lib/extensionMessages";
import { msToTime } from "../helpers";

const iconStyle: React.CSSProperties = {
  width: "24px",
  height: "24px",
  marginLeft: "10px",
  cursor: "pointer",
};

const style = `
a {
  color: #337ab7;
  text-decoration: none;
}
a:hover {
  color: #22527b;
  text-decoration: underline;
  cursor: "pointer";
}
`;

interface ExtensionToolbarProps {
  puzzleId: string;
}

const ExtensionToolbar = (props: ExtensionToolbarProps) => {
  const [timerMilliseconds, setTimerMilliseconds] = useState(0);

  useEffect(() => {
    extensionInterface.onRuntimeMessage(
      "tabStateUpdated",
      async (tabId: number | null, message: TabStateUpdatedCommand) => {
        //  Bail if it is not our puzzle...
        if (message.puzzleState.puzzleId !== props.puzzleId) {
          return;
        }
        setTimerMilliseconds(message.puzzleState.elapsedTime);
      }
    );
  }, []);
  const start = () => {
    extensionInterface.sendRuntimeMessage("start", {
      puzzleId: props.puzzleId,
    });
  };
  const finish = () => {
    extensionInterface.sendRuntimeMessage("finish", {
      puzzleId: props.puzzleId,
    });
  };
  return (
    <div>
      <style>{style}</style>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          height: "40px",
          backgroundColor: "white",
          color: "black",
          padding: "0 10px",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
          }}
        >
          <div className="timer" style={{ marginRight: "10px" }}>
            {msToTime(timerMilliseconds)}
          </div>
        </div>
        <div
          style={{
            flex: 1,
            textAlign: "center",
          }}
        >
          <a
            onClick={() => {
              extensionInterface.SendRuntimeMessage_OpenPuzlogTab();
            }}
          >
            Puzlog
          </a>
        </div>
        <div
          style={{
            flex: 1,
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
          }}
        >
          <div className="icon" style={iconStyle} onClick={start}>
            <FaPlay />
          </div>
          <div className="icon" style={iconStyle} onClick={finish}>
            <FaFlagCheckered />
          </div>
          <div className="icon" style={iconStyle}>
            &amp;#128065;
          </div>
          <div className="icon" style={iconStyle}>
            &amp;#128279;
          </div>
          <div className="icon" style={iconStyle}>
            &amp;#9654;
          </div>
          <div className="icon" style={iconStyle}>
            &amp;#9724;
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExtensionToolbar;
