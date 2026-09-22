import { describe, expect, it } from 'vitest';
import { buildBrdRolePermissionDefaults } from '../utils/permissionDefaults';
import {
  applyPermissionGuards,
  getEffectiveUserScopeFlags,
  getRoleScopeFlags,
} from '../utils/permissionHelpers';

describe('permissionDefaults and helpers', () => {
  const matrix = buildBrdRolePermissionDefaults();

  it('seeds Administrator with vessel CRUD and C Admin with vessel read-only', () => {
    expect(getRoleScopeFlags(matrix, 'Administrator', 'vessels')).toEqual({
      create: true,
      read: true,
      update: true,
      delete: true,
    });
    expect(getRoleScopeFlags(matrix, 'C Admin', 'vessels')).toEqual({
      create: false,
      read: true,
      update: false,
      delete: false,
    });
  });

  it('hard-denies C Admin document mutations even if flags are forced on', () => {
    const forced = applyPermissionGuards('documents', 'C Admin', {
      create: true,
      read: true,
      update: true,
      delete: true,
    });
    expect(forced).toEqual({
      create: false,
      read: true,
      update: false,
      delete: false,
    });
  });

  it('keeps Verifier post-inspection review off by default and allows user override', () => {
    expect(getRoleScopeFlags(matrix, 'Verifier', 'post_inspection_review').read).toBe(false);

    const effective = getEffectiveUserScopeFlags(
      matrix,
      {
        'USR-V': {
          post_inspection_review: { read: true, update: true },
        },
      },
      { id: 'USR-V', roles: ['Verifier'] },
      'post_inspection_review',
    );
    expect(effective.read).toBe(true);
    expect(effective.update).toBe(true);
  });

  it('locks audit trail update and delete for all roles', () => {
    for (const role of ['Administrator', 'Submitter', 'Verifier'] as const) {
      const flags = getRoleScopeFlags(matrix, role, 'audit_trail');
      expect(flags.read).toBe(true);
      expect(flags.update).toBe(false);
      expect(flags.delete).toBe(false);
    }
  });
});
