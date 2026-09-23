import { describe, expect, it } from 'vitest';
import { buildBrdRolePermissionDefaults } from '../utils/permissionDefaults';
import {
  applyPermissionGuards,
  getEffectiveUserScopeFlags,
  getRoleScopeFlags,
} from '../utils/permissionHelpers';
import { isViewAccessibleToPersona } from '../utils/rbacHelpers';

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

  it('does not hard-deny flags — Super Admin can force any CRUD on', () => {
    const forced = applyPermissionGuards('documents', 'C Admin', {
      create: true,
      read: true,
      update: true,
      delete: true,
    });
    expect(forced).toEqual({
      create: true,
      read: true,
      update: true,
      delete: true,
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

  it('seeds audit trail as read-only by default (template), without locking toggles', () => {
    for (const role of ['Administrator', 'Submitter', 'Verifier'] as const) {
      const flags = getRoleScopeFlags(matrix, role, 'audit_trail');
      expect(flags.read).toBe(true);
      expect(flags.update).toBe(false);
      expect(flags.delete).toBe(false);
    }
  });

  it('dynamically updates view accessibility when permission matrix read access is granted or revoked', () => {
    const customMatrix = JSON.parse(JSON.stringify(matrix));

    // Default Verifier cannot access vessels
    expect(isViewAccessibleToPersona('vessels', null, 'Verifier', customMatrix)).toBe(false);

    // Grant Verifier read access on vessels
    customMatrix['Verifier']['vessels'] = { create: false, read: true, update: false, delete: false };
    expect(isViewAccessibleToPersona('vessels', null, 'Verifier', customMatrix)).toBe(true);

    // Revoke Submitter read access on vessels
    customMatrix['Submitter']['vessels'] = { create: false, read: false, update: false, delete: false };
    expect(isViewAccessibleToPersona('vessels', null, 'Submitter', customMatrix)).toBe(false);
  });
});
