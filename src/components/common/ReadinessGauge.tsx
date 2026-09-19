/* 
  file summary: readiness gauge component rendering visual compliance percentage indicators.
  responsibilities: presents circular or bar readiness meters with color thresholds.
  role in system: used in dashboard, vessel cards, assurance set detail, and approver dashboard.
*/

import React from 'react';

interface ReadinessGaugeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

/**
  what: renders visual progress gauge for compliance readiness scores.
  how: maps score percentage to progress bar width and applies color classes.
  with what file: src/components/common/ReadinessGauge.tsx used by views and cards.
*/
export const ReadinessGauge: React.FC<ReadinessGaugeProps> = ({ score, size = 'md' }) => {
  const getScoreColorClass = (val: number) => {
    if (val >= 90) return 'bg-success';
    if (val >= 75) return 'bg-warning';
    return 'bg-danger';
  };

  const getTextColorClass = (val: number) => {
    if (val >= 90) return 'text-success';
    if (val >= 75) return 'text-warning';
    return 'text-danger';
  };

  if (size === 'lg') {
    return (
      <div className="text-center p-4 bg-light border border-secondary rounded shadow-sm">
        <div className={`display-4 fw-bold ${getTextColorClass(score)} font-mono-code`}>
          {score}%
        </div>
        <div className="text-secondary small mt-1 text-uppercase fw-semibold" style={{ letterSpacing: '0.05em' }}>
          Overall Assurance Readiness Index
        </div>
        <div className="progress mt-3" style={{ height: '8px', backgroundColor: '#e2e8f0' }}>
          <div
            className={`progress-bar ${getScoreColorClass(score)}`}
            role="progressbar"
            style={{ width: `${score}%` }}
            aria-valuenow={score}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex align-items-center gap-2" style={{ minWidth: '120px' }}>
      <div className="progress flex-grow-1" style={{ height: '6px', backgroundColor: '#e2e8f0' }}>
        <div
          className={`progress-bar ${getScoreColorClass(score)}`}
          role="progressbar"
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={`fw-semibold font-mono-code small ${getTextColorClass(score)}`}>
        {score}%
      </span>
    </div>
  );
};

