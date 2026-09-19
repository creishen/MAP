/* 
  file summary: confidence badge component rendering color-coded ocr confidence scores.
  responsibilities: displays percentage confidence scores with green (>=95%), amber (>=90%), and red (<90%) badges.
  role in system: used in document tables, requirement registers, and verifier split-screen views.
*/

import React from 'react';
import { getOcrConfidenceBadgeClass } from '../../utils/formatters';

interface ConfidenceBadgeProps {
  score: number;
  showLabel?: boolean;
}

/**
  what: renders a color-coded ocr extraction confidence badge.
  how: evaluates score threshold to apply high, medium, or low confidence css class.
  with what file: src/components/common/ConfidenceBadge.tsx used by tables and drawers.
*/
export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ score, showLabel = true }) => {
  const badgeClass = getOcrConfidenceBadgeClass(score);

  return (
    <span className={`badge ${badgeClass} px-2 py-1 font-mono-code`} style={{ fontSize: '0.75rem' }}>
      {showLabel && <span className="opacity-75 me-1">OCR:</span>}
      {score}%
    </span>
  );
};
