/* 
  file summary: user role entitlement helpers for multi-role assignments and segregation-of-duty checks.
  responsibilities: validates operational role combinations, filters users by role entitlement, and formats role labels.
  role in system: consumed by UserManagement modals, UserTable, and CreateAssuranceSetView.
*/

import { UserRolePersona } from '../types/audit';
import { RoleName } from '../types/permissions';
import { UserProfile } from '../types/user';

export const OPERATIONAL_ROLE_OPTIONS: { role: UserRolePersona; label: string }[] = [
  { role: 'Submitter', label: 'Submitter' },
  { role: 'Verifier', label: 'Verifier' },
  { role: 'Inspector', label: 'Inspector' },
  { role: 'Approver', label: 'Approver' },
  { role: 'C Admin', label: 'C Admin (Client Admin)' },
];

/**
  what: builds operational role checklist options including admin-created custom roles with optional exclusions.
  how: aggregates static operational roles and custom roles from store, filtering out any roles matching excludeRoles.
  with what file: src/utils/userRoleHelpers.ts consumed by UserRoleChecklist.tsx.
*/
export function getOperationalRoleOptions(
  customRoles: string[] = [],
  excludeRoles: RoleName[] = [],
): { role: RoleName; label: string; isCustom?: boolean }[] {
  const brd = OPERATIONAL_ROLE_OPTIONS.map(({ role, label }) => ({
    role: role as RoleName,
    label,
    isCustom: false,
  }));
  const custom = customRoles.map((role) => ({
    role: role as RoleName,
    label: `${role} `,
    isCustom: true,
  }));
  const combined = [...brd, ...custom];
  if (excludeRoles.length > 0) {
    return combined.filter((opt) => !excludeRoles.includes(opt.role));
  }
  return combined;
}

export function userHasRole(
  user: Pick<UserProfile, 'roles'>,
  role: RoleName,
): boolean {
  return user.roles.includes(role);
}

export function usersWithRole(users: UserProfile[], role: RoleName): UserProfile[] {
  return users.filter((u) => userHasRole(u, role));
}

export function formatUserRoles(roles: RoleName[]): string {
  return roles.join(', ');
}

export function splitRolesForForm(roles: RoleName[]): {
  isPlatformAdmin: boolean;
  operationalRoles: RoleName[];
} {
  return {
    isPlatformAdmin: roles.includes('Administrator'),
    operationalRoles: roles.filter((role) => role !== 'Administrator'),
  };
}

export function buildRolesFromForm(
  isPlatformAdmin: boolean,
  operationalRoles: RoleName[],
): RoleName[] {
  const roles = [...operationalRoles];
  if (isPlatformAdmin && !roles.includes('Administrator')) {
    roles.unshift('Administrator');
  }
  return roles;
}

export function getSegregationWarnings(roles: RoleName[]): string[] {
  const warnings: string[] = [];
  const has = (role: RoleName) => roles.includes(role);

  if (has('Verifier') && has('Approver')) {
    warnings.push(
      'Segregation of duties: Verifier and Approver should not be assigned to the same participant on one assurance set.',
    );
  }

  if (has('Submitter') && has('Verifier')) {
    warnings.push(
      'Segregation of duties: Submitter and Verifier require controls so the user cannot verify their own uploads on the same assurance set.',
    );
  }

  if (has('C Admin') && has('Verifier') && !has('Administrator')) {
    warnings.push(
      'C Admin may only hold Verifier access when explicitly designated under the assurance agreement.',
    );
  }

  return warnings;
}

export function userMatchesAnyRole(
  user: Pick<UserProfile, 'roles'>,
  roles: RoleName[],
): boolean {
  return roles.some((role) => user.roles.includes(role));
}

export function getAssuranceAssignmentWarnings(assignments: {
  submitterId?: string;
  verifierId?: string;
  approverId?: string;
}): string[] {
  const warnings: string[] = [];
  const { submitterId, verifierId, approverId } = assignments;

  if (submitterId && verifierId && submitterId === verifierId) {
    warnings.push(
      'Segregation of duties: the same user is assigned as both Submitter and Verifier on this assurance set.',
    );
  }

  if (verifierId && approverId && verifierId === approverId) {
    warnings.push(
      'Segregation of duties: the same user cannot be assigned as both Verifier and Approver on one assurance set.',
    );
  }

  return warnings;
}

export function hasBlockingAssuranceAssignmentConflict(assignments: {
  verifierId?: string;
  approverId?: string;
}): boolean {
  return Boolean(
    assignments.verifierId &&
      assignments.approverId &&
      assignments.verifierId === assignments.approverId,
  );
}
