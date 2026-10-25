export type UserRole = 'Admin' | 'Manager' | 'Member';

export interface User {
  _id: string;
  id?: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  avatar?: string;
  isOnline?: boolean;
  lastActiveAt?: string | Date;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface UserListResponse {
  success: boolean;
  data: {
    users: User[];
    total: number;
    page: number;
    totalPages: number;
  };
}
