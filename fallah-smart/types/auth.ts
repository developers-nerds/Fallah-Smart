export interface AuthTokens {
  access: {
    token: string;
    expires: string;
  };
  refresh: {
    token: string;
    expires: string;
  };
}

export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
  role: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
} 