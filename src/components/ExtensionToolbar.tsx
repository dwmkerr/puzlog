import React from "react";
import styles from "./ExtensionToolbar.css";

const ExtensionToolbar = () => {
  return (
    <div>
      <style>{styles}</style>
      <div className="toolbar">
        <div className="left">
          <div className="timer">00:00</div>
        </div>
        <div className="middle">Puzlog</div>
        <div className="right">
          <div className="icon">&amp;#128065;</div>
          <div className="icon">&amp;#128279;</div>
          <div className="icon">&amp;#9654;</div>
          <div className="icon">&amp;#9724;</div>
        </div>
      </div>
    </div>
  );
};

export default ExtensionToolbar;
