/* 
  file summary: unit tests for zustand state store actions and rbac persona switching.
  responsibilities: tests active persona updates, vessel registration duplicate protection, and document verification state transitions.
  role in system: executed during vitest unit test suite runs.
*/

import { describe, it, expect, beforeEach } from 'vitest';
import { useMapStore } from '../store/useMapStore';

describe('Map Store State Management', () => {
  beforeEach(() => {
    // reset persona to Administrator before test execution
    useMapStore.getState().setActivePersona('Administrator');
  });

  it('should switch active persona and log audit trail event', () => {
    const store = useMapStore.getState();
    store.setActivePersona('C Admin');

    expect(useMapStore.getState().activePersona).toBe('C Admin');
    const latestAudit = useMapStore.getState().auditEvents[0];
    expect(latestAudit.action).toBe('Switched Active User Persona');
    expect(latestAudit.justificationNotes).toContain('C Admin');
  });

  it('should block duplicate vessel registration', () => {
    const store = useMapStore.getState();
    const existingImo = store.vessels[0].imoNumber;

    const dupVessel = {
      ...store.vessels[0],
      id: 'VESSEL-NEW',
      name: 'Duplicate Vessel',
      imoNumber: existingImo,
      officialRegNumber: 'UNIQUE-REG-99',
    };

    const result = store.addVessel(dupVessel);
    expect(result.success).toBe(false);
    expect(result.message).toContain('already registered');
  });

  it('should update document verification status', () => {
    const store = useMapStore.getState();
    const targetDocId = store.documents[0].id;

    store.verifyDocument(targetDocId, 'Verified', 'Unit test verification check');

    const updatedDoc = useMapStore.getState().documents.find((d) => d.id === targetDocId);
    expect(updatedDoc?.verificationStatus).toBe('Verified');
    expect(updatedDoc?.verificationNotes).toBe('Unit test verification check');
  });
});
