import React from 'react';
import { Star, StarHalf } from 'lucide-react';

const RatingStars = ({ rating, size = 16 }) => {
  const numericRating = parseFloat(rating || 5);
  const starsArray = [];

  for (let i = 1; i <= 5; i++) {
    if (i <= numericRating) {
      // Solid Star
      starsArray.push(<Star key={i} size={size} className="fill-accent text-accent" />);
    } else if (i - 0.5 <= numericRating) {
      // Half Star
      starsArray.push(<StarHalf key={i} size={size} className="fill-accent text-accent" />);
    } else {
      // Empty Star
      starsArray.push(<Star key={i} size={size} className="text-gray-300" />);
    }
  }

  return <div className="flex gap-0.5 items-center">{starsArray}</div>;
};

export default RatingStars;
