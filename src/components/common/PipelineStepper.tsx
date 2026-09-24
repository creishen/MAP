/* 
  file summary: pipeline stepper component presenting assurance set lifecycle stage progression.
  responsibilities: renders visual steppers for stages: initiated, validation, verification, inspection, approval, certified.
  role in system: header stepper for assurance detail view and command center.
*/

import React from 'react';
import { AssuranceStage } from '../../types/assurance';

interface PipelineStepperProps {
  currentStage: AssuranceStage;
  readinessScore?: number;
  onStageSelect?: (stage: AssuranceStage) => void;
  orientation?: 'horizontal' | 'vertical';
}

/**
  what: renders visual progress stepper for assurance pipeline lifecycle stages.
  how: maps stage index order and applies active/completed css styles to each stage step in horizontal or vertical orientation; when readiness is 100% or stage is approved, marks all stages completed and checked with no active highlights.
  with what file: src/components/common/PipelineStepper.tsx used by AssuranceDetailView.tsx.
*/
export const PipelineStepper: React.FC<PipelineStepperProps> = ({
  currentStage,
  readinessScore,
  onStageSelect,
  orientation = 'horizontal',
}) => {
  const isFullyApproved =
    (readinessScore !== undefined && readinessScore >= 100) ||
    currentStage === 'Approved' ||
    currentStage === 'Certified';

  const stages: { stage: AssuranceStage; label: string; num: number }[] = [
    { stage: 'Initiated', label: 'Initiated', num: 1 },
    { stage: 'Validation', label: 'Validation', num: 2 },
    { stage: 'Verification', label: 'Verification', num: 3 },
    { stage: 'Inspection', label: 'Inspection', num: 4 },
    { stage: 'Certified', label: isFullyApproved ? 'Approved' : 'Approval', num: 5 },
  ];

  const getStageIndex = (stage: AssuranceStage): number => {
    switch (stage) {
      case 'Initiated':
        return 0;
      case 'Validation':
        return 1;
      case 'Verification':
        return 2;
      case 'Inspection':
        return 3;
      case 'Approval':
      case 'Certified':
      case 'Approved':
        return 4;
      default:
        return 0;
    }
  };

  const currentIdx = getStageIndex(currentStage);

  if (orientation === 'vertical') {
    return (
      <div className="d-flex flex-column gap-2 py-1">
        {stages.map((s, idx) => {
          const isCompleted = isFullyApproved || idx < currentIdx;
          const isActive = !isFullyApproved && idx === currentIdx;

          return (
            <div
              key={s.stage}
              className={`d-flex align-items-center gap-3 p-2 rounded-2 transition-all ${isActive
                ? 'bg-primary-subtle text-primary fw-bold border border-primary-subtle'
                : isCompleted
                  ? 'text-success'
                  : 'text-secondary opacity-75'
                }`}
              onClick={() => onStageSelect && onStageSelect(s.stage)}
              style={{ cursor: onStageSelect ? 'pointer' : 'default', fontSize: '0.8rem' }}
            >
              <div
                className={`d-flex align-items-center justify-content-center rounded-circle font-mono-code fw-bold flex-shrink-0 ${isCompleted
                  ? 'bg-success text-white'
                  : isActive
                    ? 'bg-primary text-white shadow-2xs'
                    : 'bg-light text-secondary border'
                  }`}
                style={{ width: '24px', height: '24px', fontSize: '0.7rem' }}
              >
                {isCompleted ? '✓' : s.num}
              </div>
              <span className="font-mono-code ms-1.5" style={{ fontSize: '0.775rem' }}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="map-stepper-container">
      {stages.map((s, idx) => {
        const isCompleted = isFullyApproved || idx < currentIdx;
        const isActive = !isFullyApproved && idx === currentIdx;

        return (
          <div
            key={s.stage}
            className={`map-stepper-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
            onClick={() => onStageSelect && onStageSelect(s.stage)}
            style={{ cursor: onStageSelect ? 'pointer' : 'default' }}
          >
            <div className="map-stepper-number">
              {isCompleted ? '✓' : s.num}
            </div>
            <span className="d-none d-md-inline">{s.label}</span>
          </div>
        );
      })}
    </div>
  );
};
