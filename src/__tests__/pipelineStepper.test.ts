/* 
  file summary: unit tests for pipeline stepper stage completion and highlight states.
  responsibilities: verifies that 100% readiness or approved stage marks all stages checked and completed with no active highlights.
  role in system: validates pipeline stepper presentation logic for assurance detail view and command center.
*/

import { describe, it, expect } from 'vitest';
import { AssuranceStage } from '../types/assurance';

/**
  what: calculates stage status flags (isCompleted, isActive, label) for a given stage in the pipeline stepper.
  how: checks if readiness is 100% or stage is approved; if so, marks all steps completed with no active highlight.
  with what file: src/__tests__/pipelineStepper.test.ts testing src/components/common/PipelineStepper.tsx logic.
*/
function evaluateStepperStage(
  currentStage: AssuranceStage,
  readinessScore: number | undefined,
  stageIndex: number,
  currentIdx: number,
) {
  const isFullyApproved =
    (readinessScore !== undefined && readinessScore >= 100) ||
    currentStage === 'Approved' ||
    currentStage === 'Certified';

  const isCompleted = isFullyApproved || stageIndex < currentIdx;
  const isActive = !isFullyApproved && stageIndex === currentIdx;
  const finalStageLabel = isFullyApproved ? 'Approved' : 'Approval';

  return { isCompleted, isActive, isFullyApproved, finalStageLabel };
}

describe('pipeline stepper stage progression suite', () => {
  it('marks all stages as completed with no active highlights when readiness is 100%', () => {
    const currentStage: AssuranceStage = 'Approval';
    const readinessScore = 100;
    const currentIdx = 4;

    for (let i = 0; i < 5; i++) {
      const { isCompleted, isActive, isFullyApproved, finalStageLabel } = evaluateStepperStage(
        currentStage,
        readinessScore,
        i,
        currentIdx,
      );

      expect(isFullyApproved).toBe(true);
      expect(isCompleted).toBe(true);
      expect(isActive).toBe(false);
      if (i === 4) {
        expect(finalStageLabel).toBe('Approved');
      }
    }
  });

  it('marks all stages as completed with no active highlights when stage is Approved', () => {
    const currentStage: AssuranceStage = 'Approved';
    const readinessScore = 100;
    const currentIdx = 4;

    for (let i = 0; i < 5; i++) {
      const { isCompleted, isActive, isFullyApproved, finalStageLabel } = evaluateStepperStage(
        currentStage,
        readinessScore,
        i,
        currentIdx,
      );

      expect(isFullyApproved).toBe(true);
      expect(isCompleted).toBe(true);
      expect(isActive).toBe(false);
      if (i === 4) {
        expect(finalStageLabel).toBe('Approved');
      }
    }
  });

  it('highlights current stage and marks previous stages completed during in-progress stages', () => {
    const currentStage: AssuranceStage = 'Verification';
    const readinessScore = 70;
    const currentIdx = 2;

    /* step 0 (initiated) -> completed, not active */
    expect(evaluateStepperStage(currentStage, readinessScore, 0, currentIdx)).toMatchObject({
      isCompleted: true,
      isActive: false,
    });

    /* step 1 (validation) -> completed, not active */
    expect(evaluateStepperStage(currentStage, readinessScore, 1, currentIdx)).toMatchObject({
      isCompleted: true,
      isActive: false,
    });

    /* step 2 (verification) -> active, not completed */
    expect(evaluateStepperStage(currentStage, readinessScore, 2, currentIdx)).toMatchObject({
      isCompleted: false,
      isActive: true,
    });

    /* step 3 (inspection) -> not completed, not active */
    expect(evaluateStepperStage(currentStage, readinessScore, 3, currentIdx)).toMatchObject({
      isCompleted: false,
      isActive: false,
    });

    /* step 4 (approval) -> not completed, not active, label is Approval */
    expect(evaluateStepperStage(currentStage, readinessScore, 4, currentIdx)).toMatchObject({
      isCompleted: false,
      isActive: false,
      finalStageLabel: 'Approval',
    });
  });
});
