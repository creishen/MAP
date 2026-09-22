# Roles & Permissions — revert / fallback

This feature lives on branch `feature/roles-and-permissions`. Use one of the options below if you need to undo it.

## Option A — Soft fallback (keep code, hide feature)

In `src/config/featureFlags.ts`:

```ts
export const ENABLE_ROLES_AND_PERMISSIONS = false;
```

Effects:

- **Roles & Permissions** disappears from the sidebar
- Route `#/roles-permissions` falls back to Dashboard
- Nav/route matrix checks from the permission store are skipped
- User Management and existing persona RBAC continue as before

## Option B — Leave the feature branch (recommended while evaluating)

```bash
git checkout main
```

Your working tree returns to `main` without this feature. Switch back anytime:

```bash
git checkout feature/roles-and-permissions
```

## Option C — Full discard of the branch (after merge or local commits)

If the branch was **never merged** and you want to delete it:

```bash
git checkout main
git branch -D feature/roles-and-permissions
```

If it **was merged** to main and you need to undo that merge:

```bash
git revert -m 1 <merge-commit-sha>
```

## What this feature added

| Path | Purpose |
|------|---------|
| `src/config/featureFlags.ts` | Soft on/off switch |
| `src/types/permissions.ts` | CRUD / scope types |
| `src/utils/permissionDefaults.ts` | BRD-seeded catalog + defaults |
| `src/utils/permissionHelpers.ts` | Effective permission resolution |
| `src/components/permissions/PermissionMatrix.tsx` | Matrix UI |
| `src/views/RolesAndPermissionsView.tsx` | Settings tabs |
| `src/__tests__/permissionHelpers.test.ts` | Unit tests |
| Store fields on `useMapStore` | `rolePermissionDefaults`, `userPermissionOverrides`, setters |
| Sidebar + `App.tsx` | New nav item and route |

## Quick smoke test after enable

1. Log in as **Administrator**
2. Open **Roles & Permissions** → **Role defaults** (BRD boxes pre-checked)
3. Open **User permissions** → pick a Verifier → enable **Post-inspection review → Read**
4. Click **Reset to BRD defaults** to clear overrides
