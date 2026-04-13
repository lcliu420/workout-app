export interface RequestUser {
  id: string;
  email: string;
  accessToken: string;
}

export interface AuthResponse {
  accessToken: string | null;
  refreshToken: string | null;
  requiresEmailConfirmation: boolean;
  message: string;
  user: {
    id: string;
    email: string;
    displayName: string;
    avatarUrl: string | null;
  };
}
