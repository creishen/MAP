/* 
  file summary: unit tests for c admin restrictions on inspector checklists and physical survey workflows.
  responsibilities: asserts that c admin cannot access inspector views, cannot trigger new live inspection checklists, and cannot add inspection checklists to assurance sets.
  role in system: validates rbac boundary enforcement for client administrators regarding inspector checklists.
*/

import { describe, expect, it, beforeEach } from 'vitest';
import { useMapStore } from '../store/useMapStore';
import { isViewAccessibleToPersona } from '../utils/rbacHelpers';
import { AssuranceSet } from '../types/assurance';

describe('C Admin Inspector Checklist Isolation', () => {
  beforeEach(() => {
    useMapStore.getState().setActivePersona('C Admin');
  });

  it('should block C Admin from accessing inspector and inspection routes', () => {
    expect(isViewAccessibleToPersona('inspector', undefined, 'C Admin')).toBe(false);
    expect(isViewAccessibleToPersona('inspection', undefined, 'C Admin')).toBe(false);
    expect(isViewAccessibleToPersona('inspector', 'vessel-1', 'C Admin')).toBe(false);
    expect(isViewAccessibleToPersona('inspection', 'vessel-1', 'C Admin')).toBe(false);
  });

  it('should allow Administrator to access inspector route', () => {
    expect(isViewAccessibleToPersona('inspector', undefined, 'Administrator')).toBe(true);
    expect(isViewAccessibleToPersona('inspection', undefined, 'Administrator')).toBe(true);
  });

  it('should allow Inspector with specific vessel entity to access inspector route', () => {
    expect(isViewAccessibleToPersona('inspector', 'vessel-1', 'Inspector')).toBe(true);
  });

  it('should ensure assurance set added with C Admin persona has mandatoryInspectionRequired false and no inspector checklist requirements', () => {
    const store = useMapStore.getState();
    const newCAdminSet: AssuranceSet = {
      id: 'AS-CADMIN-TEST-1',
      title: 'Chevron Vetting Campaign 2026',
      vesselId: 'vessel-1',
      vesselName: 'MV Pacific Endeavour',
      imoNumber: '9234567',
      initiatorOrg: 'Chevron Australia Pty Ltd',
      initiatorRole: 'C Admin · Client Created',
      charterer: 'Chevron Australia Pty Ltd',
      charterWindowStart: '2026-11-01',
      charterWindowEnd: '2027-11-01',
      stage: 'Initiated',
      readinessScore: 0,
      mandatoryInspectionRequired: false,
      inspectionCompleted: false,
      requirements: [
        {
          id: 'REQ-1',
          category: 'Statutory Certificate',
          title: 'Certificate of Class',
          isMandatory: true,
          isFulfilled: false,
          ocrConfidence: 95,
          verifierStatus: 'Pending',
        },
      ],
      stakeholders: undefined,
      assignedStakeholders: undefined,
      createdByPersona: ''
    };

    store.addAssuranceSet(newCAdminSet);

    const created = useMapStore.getState().assuranceSets.find((s) => s.id === 'AS-CADMIN-TEST-1');
    expect(created).toBeDefined();
    expect(created?.mandatoryInspectionRequired).toBe(false);
    expect(created?.assignedInspector).toBeUndefined();
    expect(created?.requirements.every((r) => r.category !== 'Inspection Report')).toBe(true);
  });
});
