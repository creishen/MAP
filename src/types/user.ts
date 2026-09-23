/* 
  file summary: user profile and organization member interface definitions for user management.
  responsibilities: defines attributes for internal organization users and third-party external stakeholders.
  role in system: consumed by UserManagementView, AddUserModal, and useMapStore.
*/

import { UserRolePersona } from './audit';
import { RoleName } from './permissions';

export type UserType = 'Organization' | 'Third-Party';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  /* brd personas and any admin-created custom roles */
  roles: RoleName[];
  userType: UserType;
  organization: string;
  departmentOrScope: string;
  status: 'Active' | 'Pending Invitation' | 'Inactive';
  lastActive: string;
  /* persona or role that created or invited this user profile */
  createdBy?: string;
  invitedBy?: string;
}

export type { RoleName, UserRolePersona };
