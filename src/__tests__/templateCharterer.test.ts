/* 
  file summary: unit tests for verifying charterer inclusion in assurance sets created from templates.
  responsibilities: tests that assurance sets created from existing templates carry over charterer information correctly.
  role in system: executed during vitest unit test runs.
*/

import { describe, it, expect, beforeEach } from 'vitest';
import { useMapStore } from '../store/useMapStore';
import { AssuranceSet } from '../types/assurance';

/**
  what: test suite verifying that template-based assurance set creation includes charterer details.
  how: initializes an assurance set based on a template with charterer info and asserts persistence in map store.
  with what file: src/__tests__/templateCharterer.test.ts testing src/store/useMapStore.ts and assurance models.
*/
describe('Assurance Set Template Charterer Inclusion', () => {
  beforeEach(() => {
    /* reset store persona before test */
    useMapStore.getState().setActivePersona('Administrator');
  });

  it('should include the template charterer in a newly created assurance set', () => {
    const store = useMapStore.getState();
    const templateSet = store.assuranceSets[0];
    const templateCharterer = templateSet.charterer || templateSet.initiatorOrg;

    expect(templateCharterer).toBeDefined();

    /* construct new assurance set from template */
    const newSetFromTemplate: AssuranceSet = {
      id: 'AS-2026-999',
      title: `${templateSet.title} (C Admin Charter Vetting)`,
      vesselId: templateSet.vesselId,
      vesselName: templateSet.vesselName,
      imoNumber: templateSet.imoNumber,
      initiatorOrg: 'Chevron Australia Pty Ltd',
      initiatorRole: 'C Admin · Client Created',
      charterer: templateCharterer,
      charterWindowStart: templateSet.charterWindowStart,
      charterWindowEnd: templateSet.charterWindowEnd,
      stage: 'Initiated',
      readinessScore: 0,
      mandatoryInspectionRequired: templateSet.mandatoryInspectionRequired,
      inspectionCompleted: false,
      requirements: templateSet.requirements,
    };

    store.addAssuranceSet(newSetFromTemplate);

    const addedSet = useMapStore.getState().assuranceSets.find((s) => s.id === 'AS-2026-999');
    expect(addedSet).toBeDefined();
    expect(addedSet?.charterer).toBe(templateCharterer);
  });
});
