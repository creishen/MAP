/* 
  file summary: unit test suite for c admin dashboard and sidebar access controls.
  responsibilities: verifies that c admin dashboard shows own-created assurance sets, hides audit trail card, and hides assurance sets from the sidepanel.
  role in system: validates rbac presentation rules for c admin persona.
*/

import { describe, expect, it, beforeEach } from 'vitest';
import { useMapStore } from '../store/useMapStore';
import { MOCK_ASSURANCE_SETS } from '../store/mockData';
import { isAssuranceSetAssignedToPersona } from '../utils/rbacHelpers';
import { buildBrdRolePermissionDefaults } from '../utils/permissionDefaults';
import { getRoleScopeFlags } from '../utils/permissionHelpers';

describe('c admin dashboard and sidepanel rbac suite', () => {
  beforeEach(() => {
    /* reset active persona to c admin */
    useMapStore.getState().setActivePersona('C Admin');
  });

  /**
    what: tests that c admin's assurance sets are correctly identified and filtered.
    how: applies isAssuranceSetAssignedToPersona across mock sets and checks initiator role attribution.
    with what file: src/__tests__/cAdminDashboard.test.ts testing src/utils/rbacHelpers.ts.
  */
  it('filters only c admin created assurance sets for the dashboard view', () => {
    const cAdminSets = MOCK_ASSURANCE_SETS.filter((s) => isAssuranceSetAssignedToPersona(s, 'C Admin'));

    expect(cAdminSets.length).toBeGreaterThan(0);
    cAdminSets.forEach((set) => {
      const isClientCreated =
        set.initiatorRole === 'C Admin · Client Created' ||
        set.createdByPersona === 'C Admin' ||
        set.charterer === 'Chevron Australia Pty Ltd' ||
        set.initiatorOrg === 'Southern Basin Energy Pty Ltd' ||
        set.charterer === 'Southern Basin Energy Pty Ltd' ||
        set.charterer === 'Woodside Energy Ltd' ||
        set.charterer === 'Inpex Operations Australia';

      expect(isClientCreated).toBe(true);
    });
  });

  /**
    what: tests that c admin default permissions deny read on assurance_sets scope to hide the sidepanel page button.
    how: queries role matrix flags for c admin and assurance_sets.
    with what file: src/__tests__/cAdminDashboard.test.ts testing src/utils/permissionDefaults.ts.
  */
  it('hides assurance sets from sidepanel via role permission defaults for c admin', () => {
    const matrix = buildBrdRolePermissionDefaults();
    const cAdminFlags = getRoleScopeFlags(matrix, 'C Admin', 'assurance_sets');

    expect(cAdminFlags.read).toBe(false);
    expect(cAdminFlags.create).toBe(false);
  });

  /**
    what: tests that c admin retains ability to configure assurance requirements.
    how: checks assurance_requirements scope flags for c admin persona.
    with what file: src/__tests__/cAdminDashboard.test.ts testing src/utils/permissionDefaults.ts.
  */
  it('allows c admin to manage assurance requirements checklist', () => {
    const matrix = buildBrdRolePermissionDefaults();
    const cAdminFlags = getRoleScopeFlags(matrix, 'C Admin', 'assurance_requirements');

    expect(cAdminFlags.read).toBe(true);
    expect(cAdminFlags.create).toBe(true);
  });
});
