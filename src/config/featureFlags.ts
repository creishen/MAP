/*
  file summary: feature flag for the Roles & Permissions settings UI and matrix-driven RBAC.
  responsibilities: allows disabling the new feature without deleting code (fallback / revert aid).
  role in system: consumed by AppSidebar, App.tsx, and RolesAndPermissionsView.
*/

/**
  Set to false to hide Roles & Permissions nav and skip matrix-driven route checks
  while keeping this branch's code intact. For a full revert, see
  Context Files/RolesPermissions-Revert.md or switch back to main.
*/
export const ENABLE_ROLES_AND_PERMISSIONS = true;
