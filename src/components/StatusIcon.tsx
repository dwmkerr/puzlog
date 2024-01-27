import React from "react";
import { PuzzleStatus } from "../lib/puzzle";
import theme from "../theme";

interface StatusIconProps extends React.ComponentPropsWithoutRef<"svg"> {
  status: PuzzleStatus;
  size: number;
}

const StatusIcon = ({ status, size, ...props }: StatusIconProps) => {
  // Define pastel colors
  const colors = {
    grey: "#B0B0B0",
    blue: theme.colors.inProgress,
    green: theme.colors.success,
    red: "#d9534f",
    amber: "#f0ad4e",
  };

  // Render different icons based on the status
  const renderIcon = () => {
    switch (status) {
      case PuzzleStatus.NotStarted:
        return (
          <svg height={size} width={size} viewBox="0 0 24 24" {...props}>
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke={colors.grey}
              strokeWidth="2"
              fill="none"
            />
            <line
              x1="6"
              y1="12"
              x2="18"
              y2="12"
              stroke={colors.grey}
              strokeWidth="2"
            />
          </svg>
        );
      case PuzzleStatus.Started:
        return (
          <svg height={size} width={size} viewBox="0 0 32 32" {...props}>
            <g fill={colors.blue} stroke={colors.blue}>
              <path d="M16,2A14,14,0,1,0,30,16,14.0158,14.0158,0,0,0,16,2Zm0,26A12,12,0,0,1,16,4V16l8.4812,8.4814A11.9625,11.9625,0,0,1,16,28Z"></path>
            </g>
          </svg>
        );
      // case PuzzleStatus.Paused:
      //   return (
      //     <svg height="24" width="24">
      //       <circle
      //         cx="12"
      //         cy="12"
      //         r="10"
      //         stroke={colors.amber}
      //         strokeWidth="2"
      //         fill="none"
      //       />
      //       <rect
      //         x="9"
      //         y="7"
      //         width="1"
      //         height="10"
      //         stroke={colors.amber}
      //         strokeWidth="2"
      //         fill={colors.amber}
      //       />
      //       <rect
      //         x="14.5"
      //         y="7"
      //         width="1"
      //         height="10"
      //         stroke={colors.amber}
      //         strokeWidth="2"
      //         fill={colors.amber}
      //       />
      //     </svg>
      //   );
      case PuzzleStatus.Finished:
        return (
          <svg height={size} width={size} viewBox="0 0 24 24" {...props}>
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke={colors.green}
              strokeWidth="2"
              fill="none"
            />
            <path
              d="M6,12l4,4l8-8"
              stroke={colors.green}
              strokeWidth="2"
              fill="none"
            />
          </svg>
        );
      // case PuzzleStatus.Failed:
      //   return (
      //     <svg height="24" width="24">
      //       <circle
      //         cx="12"
      //         cy="12"
      //         r="10"
      //         stroke={colors.red}
      //         strokeWidth="2"
      //         fill="none"
      //       />
      //       <path
      //         d="M8,8l8,8M8,16l8-8"
      //         stroke={colors.red}
      //         strokeWidth="2"
      //         fill="none"
      //       />
      //     </svg>
      //   );
      case PuzzleStatus.Unknown: // Added 'Unknown' state
      default:
        return (
          <svg height={size} width={size} viewBox="0 0 24 24" {...props}>
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke={colors.grey}
              strokeWidth="2"
              fill={colors.grey}
            />
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              alignmentBaseline="central"
              fill="white"
              fontSize="14"
            >
              ?
            </text>
          </svg>
        );
    }
  };

  return renderIcon();
};

export default StatusIcon;
