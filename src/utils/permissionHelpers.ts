/*
  file summary: helpers to resolve effective CRUD permissions from role defaults and user overrides.
  responsibilities: merges role matrix with per-user overrides, applies hard BRD denies and scope locks.
  role in system: consumed by RolesAndPermissionsView, AppSidebar, and rbacHelpers.
*/

import { UserRolePersona } from '../types/audit';
import { UserProfile } from '../types/user';
import {
  CrudAction,
  CrudFlags,
  PermissionScopeDefinition,
  PermissionScopeKey,
  RolePermissionMatrix,
  UserPermissionOverrides,
  emptyCrud,
} from '../types/permissions';

/**
  what: merges base CRUD flags with a partial override patch.
*/
export function mergeCrudFlags(base: CrudFlags, patch?: Partial<CrudFlags>): CrudFlags {
  if (!patch) return { ...base };
  return {
    create: patch.create ?? base.create,
    read: patch.read ?? base.read,
    update: patch.update ?? base.update,
    delete: patch.delete ?? base.delete,
  };
}

/**
  what: formerly applied BRD lock/hardDeny rules; now a pass-through so Super Admin controls all flags.
*/
export function applyPermissionGuards(
  _scopeKey: string,
  _role: string,
  flags: CrudFlags,
  _extraScopes: PermissionScopeDefinition[] = [],
): CrudFlags {
  return { ...flags };
}

/**
  what: unions CRUD flags across multiple roles (any role granting a verb wins).
*/
export function unionCrudFlags(flagSets: CrudFlags[]): CrudFlags {
  return flagSets.reduce(
    (acc, flags) => ({
      create: acc.create || flags.create,
      read: acc.read || flags.read,
      update: acc.update || flags.update,
      delete: acc.delete || flags.delete,
    }),
    emptyCrud(),
  );
}

/**
  what: resolves effective CRUD for a single role on a scope from the role defaults matrix.
*/
export function getRoleScopeFlags(
  matrix: RolePermissionMatrix,
  role: string,
  scopeKey: string,
  _extraScopes: PermissionScopeDefinition[] = [],
): CrudFlags {
  return matrix[role]?.[scopeKey] ?? emptyCrud();
}

/**
  what: resolves effective CRUD for a user by unioning their roles then applying user overrides.
*/
export function getEffectiveUserScopeFlags(
  matrix: RolePermissionMatrix,
  overrides: UserPermissionOverrides,
  user: Pick<UserProfile, 'id' | 'roles'>,
  scopeKey: string,
  extraScopes: PermissionScopeDefinition[] = [],
): CrudFlags {
  if (!user.roles.length) return emptyCrud();

  const fromRoles = unionCrudFlags(
    user.roles.map((role) => getRoleScopeFlags(matrix, role, scopeKey, extraScopes)),
  );
  const patch = overrides[user.id]?.[scopeKey];
  return mergeCrudFlags(fromRoles, patch);
}

/**
  what: checks whether a user (or active persona) may perform a CRUD action on a scope.
*/
export function canPerform(
  matrix: RolePermissionMatrix,
  overrides: UserPermissionOverrides,
  user: Pick<UserProfile, 'id' | 'roles'> | null,
  persona: UserRolePersona,
  scopeKey: string,
  action: CrudAction,
  extraScopes: PermissionScopeDefinition[] = [],
): boolean {
  if (user) {
    return getEffectiveUserScopeFlags(matrix, overrides, user, scopeKey, extraScopes)[action];
  }
  return getRoleScopeFlags(matrix, persona, scopeKey, extraScopes)[action];
}

/**
  what: returns whether any override exists for a user on a given scope action.
*/
export function isUserOverride(
  overrides: UserPermissionOverrides,
  userId: string,
  scopeKey: string,
  action: CrudAction,
): boolean {
  const patch = overrides[userId]?.[scopeKey];
  return patch !== undefined && patch[action] !== undefined;
}

/** Maps hash view keys to the primary permission scope that gates Read access */
export const VIEW_TO_SCOPE: Record<string, PermissionScopeKey> = {
  dashboard: 'dashboard',
  vessels: 'vessels',
  'assurance-sets': 'assurance_sets',
  'create-assurance-set': 'assurance_sets',
  documents: 'documents',
  crew: 'crew',
  verifier: 'verification_queue',
  inspector: 'inspection_workspace',
  inspection: 'inspection_workspace',
  capa: 'capa',
  capas: 'capa',
  approver: 'approval_gate',
  audit: 'audit_trail',
  users: 'users',
  'roles-permissions': 'role_rights',
};
