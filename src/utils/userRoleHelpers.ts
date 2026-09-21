/* 
  file summary: user role entitlement helpers for multi-role assignments and segregation-of-duty checks.
  responsibilities: validates operational role combinations, filters users by role entitlement, and formats role labels.
  role in system: consumed by UserManagement modals, UserTable, and CreateAssuranceSetView.
*/

import { UserRolePersona } from '../types/audit';
import { UserProfile } from '../types/user';

export const OPERATIONAL_ROLE_OPTIONS: { role: UserRolePersona; label: string }[] = [
  { role: 'Submitter', label: 'Submitter' },
  { role: 'Verifier', label: 'Verifier' },
  { role: 'Inspector', label: 'Inspector' },
  { role: 'Approver', label: 'Approver' },
  { role: 'C Admin', label: 'C Admin (Client Admin)' },
];

export function userHasRole(
  user: Pick<UserProfile, 'roles'>,
  role: UserRolePersona,
): boolean {
  return user.roles.includes(role);
}

export function usersWithRole(users: UserProfile[], role: UserRolePersona): UserProfile[] {
  return users.filter((u) => userHasRole(u, role));
}

export function formatUserRoles(roles: UserRolePersona[]): string {
  return roles.join(', ');
}

export function splitRolesForForm(roles: UserRolePersona[]): {
  isPlatformAdmin: boolean;
  operationalRoles: UserRolePersona[];
} {
  return {
    isPlatformAdmin: roles.includes('Administrator'),
    operationalRoles: roles.filter((role) => role !== 'Administrator'),
  };
}

export function buildRolesFromForm(
  isPlatformAdmin: boolean,
  operationalRoles: UserRolePersona[],
): UserRolePersona[] {
  const roles = [...operationalRoles];
  if (isPlatformAdmin && !roles.includes('Administrator')) {
    roles.unshift('Administrator');
  }
  return roles;
}

export function getSegregationWarnings(roles: UserRolePersona[]): string[] {
  const warnings: string[] = [];
  const has = (role: UserRolePersona) => roles.includes(role);

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
  roles: UserRolePersona[],
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
