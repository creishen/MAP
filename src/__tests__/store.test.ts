/* 
  file summary: unit tests for zustand state store actions and rbac persona switching.
  responsibilities: tests active persona updates, vessel registration duplicate protection, and document verification state transitions.
  role in system: executed during vitest unit test suite runs.
*/

import { describe, it, expect, beforeEach } from 'vitest';
import { useMapStore } from '../store/useMapStore';
import { isViewAccessibleToPersona } from '../utils/rbacHelpers';

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

  it('should return vesselId on successful registration', () => {
    const store = useMapStore.getState();
    const initialCount = store.vessels.length;

    const newVessel = {
      ...store.vessels[0],
      id: 'VESSEL-UNIT-TEST',
      name: 'MV Unit Test Vessel',
      imoNumber: '9999999',
      officialRegNumber: 'UNIT-REG-001',
    };

    const result = store.addVessel(newVessel);
    expect(result.success).toBe(true);
    expect(result.vesselId).toBe('VESSEL-UNIT-TEST');
    expect(useMapStore.getState().vessels.length).toBe(initialCount + 1);
  });

  it('should update document verification status', () => {
    const store = useMapStore.getState();
    const targetDocId = store.documents[0].id;

    store.verifyDocument(targetDocId, 'Verified', 'Unit test verification check');

    const updatedDoc = useMapStore.getState().documents.find((d) => d.id === targetDocId);
    expect(updatedDoc?.verificationStatus).toBe('Verified');
    expect(updatedDoc?.verificationNotes).toBe('Unit test verification check');
  });

  it('should update user profile details and record audit log event', () => {
    const store = useMapStore.getState();
    const targetUser = store.users[0];

    const updatedUser = {
      ...targetUser,
      name: 'Captain Updated Name',
      role: 'Approver' as const,
    };

    store.updateUser(updatedUser);

    const userInStore = useMapStore.getState().users.find((u) => u.id === targetUser.id);
    expect(userInStore?.name).toBe('Captain Updated Name');
    expect(userInStore?.role).toBe('Approver');

    const latestAudit = useMapStore.getState().auditEvents[0];
    expect(latestAudit.action).toBe('Updated User Profile');
    expect(latestAudit.targetAsset).toContain('Captain Updated Name');
  });

  it('should restrict users management view access strictly to Administrator persona', () => {
    expect(isViewAccessibleToPersona('users', undefined, 'Administrator')).toBe(true);
    expect(isViewAccessibleToPersona('users', undefined, 'Submitter')).toBe(false);
    expect(isViewAccessibleToPersona('users', undefined, 'Verifier')).toBe(false);
    expect(isViewAccessibleToPersona('users', undefined, 'Inspector')).toBe(false);
    expect(isViewAccessibleToPersona('users', undefined, 'Approver')).toBe(false);
    expect(isViewAccessibleToPersona('users', undefined, 'C Admin')).toBe(false);
  });

  it('should add STCW Layer 1 and Layer 2 certificates to crew members and record audit log', () => {
    const store = useMapStore.getState();
    const targetCrew = store.crew[0];

    const layer1Doc = {
      id: 'DOC-CRW-L1-TEST',
      title: 'ENG1 Medical Certificate',
      layer: 'Layer 1 - Universal Core' as const,
      stcwRegulation: 'STCW Reg I/9',
      certificateNo: 'ENG1-AU-99120',
      issuingAuthority: 'AMSA Medical Examiner',
      issueDate: '2026-01-01',
      expiryDate: '2028-01-01',
      verificationStatus: 'Verified' as const,
    };

    store.addCrewDocument(targetCrew.id, layer1Doc);

    let updatedCrew = useMapStore.getState().crew.find((c) => c.id === targetCrew.id);
    expect(updatedCrew?.layer1CoreDocuments.some((d) => d.id === 'DOC-CRW-L1-TEST')).toBe(true);

    const layer2Doc = {
      id: 'DOC-CRW-L2-TEST',
      title: 'Advanced Oil Tanker Endorsement',
      layer: 'Layer 2 - Vessel Specific & Endorsements' as const,
      stcwRegulation: 'STCW Reg V/1-1',
      certificateNo: 'TANK-AU-8871',
      issuingAuthority: 'AMSA Australia',
      issueDate: '2026-01-01',
      expiryDate: '2031-01-01',
      verificationStatus: 'Verified' as const,
    };

    store.addCrewDocument(targetCrew.id, layer2Doc);

    updatedCrew = useMapStore.getState().crew.find((c) => c.id === targetCrew.id);
    expect(updatedCrew?.layer2Endorsements.some((d) => d.id === 'DOC-CRW-L2-TEST')).toBe(true);

    const latestAudit = useMapStore.getState().auditEvents[0];
    expect(latestAudit.action).toContain('Uploaded Crew STCW Document');
  });

  it('should allow C Admin (Client Admin) to access create-assurance-set view', () => {
    expect(isViewAccessibleToPersona('create-assurance-set', undefined, 'C Admin')).toBe(true);
    expect(isViewAccessibleToPersona('create-assurance-set', undefined, 'Administrator')).toBe(true);
    expect(isViewAccessibleToPersona('create-assurance-set', undefined, 'Submitter')).toBe(true);
    expect(isViewAccessibleToPersona('create-assurance-set', undefined, 'Verifier')).toBe(false);
  });
});
