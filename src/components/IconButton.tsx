import React from "react";
type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

const IconButton = ({ disabled, children, ...props }: IconButtonProps) => {
  return (
    <button
      type="button"
      style={{
        cursor: disabled ? "not-allowed" : "pointer",
        background: disabled ? "#ccc" : "transparent",
        border: "none",
        outline: "none",
        padding: "8px",
        margin: "4px",
        borderRadius: "50%",
        transition: "background 0.3s",
      }}
      onMouseOver={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = "#f0f0f0";
        }
      }}
      onMouseOut={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = "transparent";
        }
      }}
      {...props}
    >
      {children}
    </button>
  );
};

export default IconButton;
