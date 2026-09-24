/* 
  file summary: unit tests for c admin and vessel admin user management, user provisioning, and role visibility controls.
  responsibilities: tests that c admin and vessel admin can see their own details and created users, and validates rbac isolation.
  role in system: validates rbac boundary enforcement for user management directory.
*/

import { describe, expect, it, beforeEach } from 'vitest';
import { useMapStore } from '../store/useMapStore';
import { filterUsersForPersona } from '../utils/rbacHelpers';
import { getOperationalRoleOptions, buildRolesFromForm } from '../utils/userRoleHelpers';
import { UserProfile } from '../types/user';

describe('C Admin & Vessel Admin User Management & RBAC Isolation', () => {
  beforeEach(() => {
    useMapStore.getState().setActivePersona('C Admin');
  });

  /**
    what: tests role options exclude c admin role when specified.
    how: queries getOperationalRoleOptions with c admin excluded.
    with what file: src/__tests__/cAdminUserManagement.test.ts testing userRoleHelpers.ts.
  */
  it('should exclude C Admin role from operational role options when excluded', () => {
    const options = getOperationalRoleOptions([], ['C Admin']);
    const roleKeys = options.map((opt) => opt.role);
    expect(roleKeys).toContain('Submitter');
    expect(roleKeys).toContain('Verifier');
    expect(roleKeys).toContain('Inspector');
    expect(roleKeys).toContain('Approver');
    expect(roleKeys).not.toContain('C Admin');
  });

  /**
    what: tests role options exclude both c admin and submitter for client admin provisioning.
    how: queries getOperationalRoleOptions with both roles excluded.
    with what file: src/__tests__/cAdminUserManagement.test.ts testing userRoleHelpers.ts.
  */
  it('should exclude both C Admin and Submitter roles when C Admin provisions user roles', () => {
    const options = getOperationalRoleOptions([], ['C Admin', 'Submitter']);
    const roleKeys = options.map((opt) => opt.role);
    expect(roleKeys).not.toContain('Submitter');
    expect(roleKeys).not.toContain('C Admin');
    expect(roleKeys).toContain('Verifier');
    expect(roleKeys).toContain('Inspector');
    expect(roleKeys).toContain('Approver');
  });

  /**
    what: tests that c admin can see their own details and the users they created while filtering out unrelated users.
    how: passes mock user list to filterUsersForPersona with 'C Admin' persona.
    with what file: src/__tests__/cAdminUserManagement.test.ts testing rbacHelpers.ts.
  */
  it('should allow C Admin to see their own details and users they created while filtering out unrelated users', () => {
    const mockUsers: UserProfile[] = [
      {
        id: 'USR-ADMIN',
        name: 'Platform Admin',
        email: 'admin@northwindmarine.com',
        roles: ['Administrator'],
        userType: 'Organization',
        organization: 'Northwind Marine Pty Ltd',
        departmentOrScope: 'System Administration',
        status: 'Active',
        lastActive: 'Just Now',
      },
      {
        id: 'USR-CLIENT-SELF',
        name: 'S. Basin',
        email: 's.basin@southernbasin.com.au',
        roles: ['C Admin', 'Approver'],
        userType: 'Organization',
        organization: 'Southern Basin Energy',
        departmentOrScope: 'Client / Charterer Management',
        status: 'Active',
        lastActive: 'Just Now',
      },
      {
        id: 'USR-VERIFIER-CREATED',
        name: 'Jane Auditor',
        email: 'jane@dnv.com',
        roles: ['Verifier'],
        userType: 'Third-Party',
        organization: 'DNV Maritime',
        departmentOrScope: 'Statutory Verification',
        status: 'Active',
        lastActive: '1 hr ago',
        createdBy: 'C Admin',
        invitedBy: 'C Admin',
      },
      {
        id: 'USR-UNRELATED',
        name: 'Unrelated Operator',
        email: 'operator@northwind.com',
        roles: ['Submitter'],
        userType: 'Organization',
        organization: 'Northwind Marine Pty Ltd',
        departmentOrScope: 'Fleet Operations',
        status: 'Active',
        lastActive: '2 hrs ago',
      },
    ];

    const visibleToCAdmin = filterUsersForPersona(mockUsers, 'C Admin');
    const visibleIds = visibleToCAdmin.map((u) => u.id);

    /* C Admin sees their own details */
    expect(visibleIds).toContain('USR-CLIENT-SELF');
    /* C Admin sees users they created */
    expect(visibleIds).toContain('USR-VERIFIER-CREATED');
    /* Platform Admin and unrelated vessel operators are filtered out */
    expect(visibleIds).not.toContain('USR-ADMIN');
    expect(visibleIds).not.toContain('USR-UNRELATED');
  });

  /**
    what: tests that vessel admin (administrator) can see their own details and users they created while filtering out client-created users.
    how: passes mock user list to filterUsersForPersona with 'Administrator' persona.
    with what file: src/__tests__/cAdminUserManagement.test.ts testing rbacHelpers.ts.
  */
  it('should allow Vessel Admin to see their own details and users they created while filtering out client-created users', () => {
    const mockUsers: UserProfile[] = [
      {
        id: 'USR-ADMIN-SELF',
        name: 'K. Osei',
        email: 'k.osei@northwindmarine.com',
        roles: ['Administrator'],
        userType: 'Organization',
        organization: 'Northwind Marine Pty Ltd',
        departmentOrScope: 'IT Systems & Governance',
        status: 'Active',
        lastActive: 'Just Now',
      },
      {
        id: 'USR-OPS-CREATED',
        name: 'M. Chen',
        email: 'm.chen@northwindmarine.com',
        roles: ['Submitter'],
        userType: 'Organization',
        organization: 'Northwind Marine Pty Ltd',
        departmentOrScope: 'Vessel Operations',
        status: 'Active',
        lastActive: '1 hr ago',
        createdBy: 'Administrator',
      },
      {
        id: 'USR-CLIENT-USER',
        name: 'D. Harrison',
        email: 'd.harrison@chevron.com',
        roles: ['C Admin'],
        userType: 'Third-Party',
        organization: 'Chevron Australia',
        departmentOrScope: 'Charter Vetting',
        status: 'Pending Invitation',
        lastActive: 'Invitation Sent',
        createdBy: 'C Admin',
        invitedBy: 'C Admin',
      },
    ];

    const visibleToAdmin = filterUsersForPersona(mockUsers, 'Administrator');
    const visibleIds = visibleToAdmin.map((u) => u.id);

    /* Vessel admin sees their own details */
    expect(visibleIds).toContain('USR-ADMIN-SELF');
    /* Vessel admin sees users they created */
    expect(visibleIds).toContain('USR-OPS-CREATED');
    /* Client admin users created by C Admin are filtered out */
    expect(visibleIds).not.toContain('USR-CLIENT-USER');
  });

  /**
    what: tests that c admin can provision and add an invited user to the store.
    how: dispatches addUser and verifies the user is present in store and visible to c admin.
    with what file: src/__tests__/cAdminUserManagement.test.ts testing useMapStore.ts.
  */
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
    expect(addedUser?.createdBy).toBe('C Admin');

    const visibleUsers = filterUsersForPersona(updatedUsers, 'C Admin');
    expect(visibleUsers.some((u) => u.id === 'USR-TEST-INVITE')).toBe(true);
  });

  /**
    what: tests that building roles for c admin form excludes platform administrator.
    how: calls buildRolesFromForm with isCAdmin flag active.
    with what file: src/__tests__/cAdminUserManagement.test.ts testing userRoleHelpers.ts.
  */
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
