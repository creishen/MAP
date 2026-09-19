/* 
  file summary: pipeline stepper component presenting assurance set lifecycle stage progression.
  responsibilities: renders visual steppers for stages: initiated, validation, verification, inspection, approval, certified.
  role in system: header stepper for assurance detail view and command center.
*/

import React from 'react';
import { AssuranceStage } from '../../types/assurance';

interface PipelineStepperProps {
  currentStage: AssuranceStage;
  onStageSelect?: (stage: AssuranceStage) => void;
}

/**
  what: renders visual progress stepper for assurance pipeline lifecycle stages.
  how: maps stage index order and applies active/completed css styles to each stage step.
  with what file: src/components/common/PipelineStepper.tsx used by AssuranceDetailView.tsx.
*/
export const PipelineStepper: React.FC<PipelineStepperProps> = ({ currentStage, onStageSelect }) => {
  const stages: { stage: AssuranceStage; label: string; num: number }[] = [
    { stage: 'Initiated', label: '1. Initiated', num: 1 },
    { stage: 'Validation', label: '2. Validation', num: 2 },
    { stage: 'Verification', label: '3. Verification', num: 3 },
    { stage: 'Inspection', label: '4. Inspection', num: 4 },
    { stage: 'Approval', label: '5. Approval', num: 5 },
    { stage: 'Certified', label: '6. Certified', num: 6 },
  ];

  const currentIdx = stages.findIndex((s) => s.stage === currentStage);

  return (
    <div className="map-stepper-container">
      {stages.map((s, idx) => {
        const isCompleted = idx < currentIdx;
        const isActive = idx === currentIdx;

        return (
          <div
            key={s.stage}
            className={`map-stepper-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
            onClick={() => onStageSelect && onStageSelect(s.stage)}
            style={{ cursor: onStageSelect ? 'pointer' : 'default' }}
          >
            <div className="map-stepper-number">
              {isCompleted ? 'OK' : s.num}
            </div>
            <span className="d-none d-md-inline">{s.label}</span>
          </div>
        );
      })}
    </div>
  );
};
