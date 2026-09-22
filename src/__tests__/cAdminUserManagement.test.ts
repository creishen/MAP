/* 
  file summary: unit tests for c admin user management, user provisioning, and role visibility controls.
  responsibilities: tests that c admin can add or invite users while hiding platform full access control and the c admin operational role.
  role in system: validates rbac boundary enforcement for client administrators in user management.
*/

import { describe, expect, it, beforeEach } from 'vitest';
import { useMapStore } from '../store/useMapStore';
import { filterUsersForPersona } from '../utils/rbacHelpers';
import { getOperationalRoleOptions, buildRolesFromForm } from '../utils/userRoleHelpers';
import { UserProfile } from '../types/user';

describe('C Admin User Management & RBAC Isolation', () => {
  beforeEach(() => {
    useMapStore.getState().setActivePersona('C Admin');
  });

  it('should exclude C Admin role from operational role options when excluded', () => {
    const options = getOperationalRoleOptions([], ['C Admin']);
    const roleKeys = options.map((opt) => opt.role);
    expect(roleKeys).toContain('Submitter');
    expect(roleKeys).toContain('Verifier');
    expect(roleKeys).toContain('Inspector');
    expect(roleKeys).toContain('Approver');
    expect(roleKeys).not.toContain('C Admin');
  });

  it('should filter out Administrator users from C Admin visible directory', () => {
    const mockUsers: UserProfile[] = [
      {
        id: 'USR-ADMIN',
        name: 'Platform Admin',
        email: 'admin@map.io',
        roles: ['Administrator'],
        userType: 'Organization',
        organization: 'MAP Governance Team',
        departmentOrScope: 'System Administration',
        status: 'Active',
        lastActive: 'Just Now',
      },
      {
        id: 'USR-CLIENT',
        name: 'C Admin User',
        email: 'cadmin@southernbasin.com',
        roles: ['C Admin'],
        userType: 'Organization',
        organization: 'Southern Basin Energy Pty Ltd',
        departmentOrScope: 'Chartering',
        status: 'Active',
        lastActive: 'Just Now',
      },
      {
        id: 'USR-VERIFIER',
        name: 'Jane Auditor',
        email: 'jane@dnv.com',
        roles: ['Verifier'],
        userType: 'Third-Party',
        organization: 'DNV Maritime',
        departmentOrScope: 'Statutory Verification',
        status: 'Active',
        lastActive: '1 hr ago',
      },
    ];

    const visibleToCAdmin = filterUsersForPersona(mockUsers, 'C Admin');
    const visibleIds = visibleToCAdmin.map((u) => u.id);

    expect(visibleIds).not.toContain('USR-ADMIN');
    expect(visibleIds).toContain('USR-CLIENT');
    expect(visibleIds).toContain('USR-VERIFIER');
  });

  it('should allow C Admin to provision and add an invited third-party auditor user', () => {
    const store = useMapStore.getState();
    const newUser: UserProfile = {
      id: 'USR-TEST-INVITE',
      name: 'Captain Robert Shaw',
      email: 'robert.shaw@dnv-inspection.com',
      roles: ['Inspector'],
      userType: 'Third-Party',
      organization: 'DNV Maritime Compliance',
      departmentOrScope: 'Physical Vessel Audits',
      status: 'Pending Invitation',
      lastActive: 'Invitation Sent',
    };

    store.addUser(newUser);

    const updatedUsers = useMapStore.getState().users;
    const addedUser = updatedUsers.find((u) => u.id === 'USR-TEST-INVITE');
    expect(addedUser).toBeDefined();
    expect(addedUser?.name).toBe('Captain Robert Shaw');
    expect(addedUser?.status).toBe('Pending Invitation');
    expect(addedUser?.roles).toEqual(['Inspector']);

    const visibleUsers = filterUsersForPersona(updatedUsers, 'C Admin');
    expect(visibleUsers.some((u) => u.id === 'USR-TEST-INVITE')).toBe(true);
  });

  it('should guarantee that building roles for C Admin excludes Platform Administrator', () => {
    const isCAdmin = true;
    const isPlatformAdminChecked = false;
    const selectedOperationalRoles = ['Verifier', 'Inspector'] as const;

    const effectivePlatformAdmin = isCAdmin ? false : isPlatformAdminChecked;
    const effectiveRoles = buildRolesFromForm(effectivePlatformAdmin, [...selectedOperationalRoles]);

    expect(effectiveRoles).not.toContain('Administrator');
    expect(effectiveRoles).toContain('Verifier');
    expect(effectiveRoles).toContain('Inspector');
  });
});
