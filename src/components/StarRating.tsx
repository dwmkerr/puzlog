import React, { useState } from "react";

interface StarRatingProps {
  maxStars: number;
  stars: number | null;
  onStarsChanged: (stars: number) => void;
}

const StarRating = ({
  maxStars = 5,
  stars,
  onStarsChanged,
}: StarRatingProps) => {
  const [hoveredStars, setHoveredStars] = useState<number | null>(null);

  const handleMouseOver = (hoveredStars: number) => {
    setHoveredStars(hoveredStars);
  };

  const handleMouseLeave = () => {
    setHoveredStars(null);
  };

  const handleClickStar = (star: number) => {
    setHoveredStars(star);
    onStarsChanged(star);
  };

  const renderStars = () => {
    const currentStars = stars || 0;
    const filledStars = Math.min(
      hoveredStars !== null ? hoveredStars : currentStars
    );

    // const starStyle = {
    //   cursor: "pointer",
    //   marginRight: "5px",
    //   fontSize: "1.2em",
    // };

    // const starIcons = Array.from({ length: maxStars }, (_, index) => (
    //   <span
    //     key={index}
    //     onMouseOver={() => handleMouseOver(index + 1)}
    //     onClick={() => handleClickStar(index + 1)}
    //     style={{
    //       ...starStyle,
    //       color: index < filledStars ? "#ffcc00" : "#ccc",
    //     }}
    //   >
    //     ☆
    //   </span>
    // ));

    const starIcons = Array.from({ length: maxStars }, (_, index) => {
      const isHoverIndex = hoveredStars !== null && index === hoveredStars - 1;
      const size = isHoverIndex ? "1.2em" : "1.2em";
      const fill = index < filledStars ? "#ffcc00" : "none";
      const stroke = index < filledStars ? "#ffcc00" : "#ccc";
      const strokeWidth = isHoverIndex ? 3 : 2;
      return (
        <span
          key={index}
          onMouseOver={() => handleMouseOver(index + 1)}
          onClick={() => handleClickStar(index + 1)}
          style={{
            cursor: "pointer",
            marginRight: "5px",
          }}
        >
          <svg viewBox="0 0 24 24" width={size} height={size}>
            <polygon
              points="12 2 15.1 8.5 22 9.3 17 14.2 18.2 21.3 12 18 5.8 21.3 7 14.2 2 9.3 8.9 8.5"
              stroke={stroke}
              fill={fill}
              strokeWidth={strokeWidth}
            />
          </svg>
        </span>
      );
    });

    return starIcons;
  };

  return (
    <div className="star-rating" onMouseLeave={handleMouseLeave}>
      {renderStars()}
    </div>
  );
};

export default StarRating;
