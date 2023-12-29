import React from "react";
import * as extensionInterface from "../extensionInterface";

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

const ExtensionToolbar = () => {
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
            00:00{" "}
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
