import { describe, expect, it } from 'vitest';
import {
  buildRolesFromForm,
  getAssuranceAssignmentWarnings,
  getSegregationWarnings,
  hasBlockingAssuranceAssignmentConflict,
  splitRolesForForm,
  usersWithRole,
} from '../utils/userRoleHelpers';
import { MOCK_USERS } from '../store/mockData';

describe('userRoleHelpers', () => {
  it('should split and rebuild multi-role form state', () => {
    const split = splitRolesForForm(['Administrator', 'Submitter', 'Verifier']);
    expect(split.isPlatformAdmin).toBe(true);
    expect(split.operationalRoles).toEqual(['Submitter', 'Verifier']);

    const rebuilt = buildRolesFromForm(true, ['Verifier']);
    expect(rebuilt).toEqual(['Administrator', 'Verifier']);
  });

  it('should surface segregation warnings for risky role combinations', () => {
    const warnings = getSegregationWarnings(['Submitter', 'Verifier', 'Approver']);
    expect(warnings.length).toBeGreaterThanOrEqual(2);
    expect(warnings.some((w) => w.includes('Submitter and Verifier'))).toBe(true);
    expect(warnings.some((w) => w.includes('Verifier and Approver'))).toBe(true);
  });

  it('should filter users by operational role entitlement', () => {
    const submitters = usersWithRole(MOCK_USERS, 'Submitter');
    expect(submitters.some((u) => u.id === 'USR-102')).toBe(true);
    expect(submitters.every((u) => u.roles.includes('Submitter'))).toBe(true);
  });

  it('should detect assurance assignment segregation conflicts', () => {
    const warnings = getAssuranceAssignmentWarnings({
      submitterId: 'USR-102',
      verifierId: 'USR-102',
      approverId: 'USR-204',
    });
    expect(warnings.some((w) => w.includes('Submitter and Verifier'))).toBe(true);

    expect(
      hasBlockingAssuranceAssignmentConflict({
        verifierId: 'USR-202',
        approverId: 'USR-202',
      }),
    ).toBe(true);
  });
});
