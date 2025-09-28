// Google OAuth type definitions

export interface GoogleUser {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  refresh_token?: string;
  scope: string;
  id_token?: string;
}

export interface ErrorResponse {
  error: string;
  error_description?: string;
}

export interface AuthRequest {
  client_id?: string;
  redirect_uri?: string;
  response_type?: string;
  scope?: string;
  state?: string;
  code?: string;
  grant_type?: string;
  client_secret?: string;
  refresh_token?: string;
}

export interface HealthResponse {
  status: string;
  service: string;
  timestamp: string;
}

export interface ServerInfo {
  message: string;
  endpoints: string[];
}
