import jwt from "jsonwebtoken";
import { config } from "../config/config.js";
import type { ErrorResponse } from "./types.js";

export function generateAuthCode(): string {
  return "mock_auth_code_1234567890";
}

export function generateAccessToken(): string {
  return "mock_access_token_1234567890";
}

export function generateRefreshToken(): string {
  return "mock_refresh_token_1234567890";
}

export function getCurrentTimestamp(): string {
  return "2024-01-01T00:00:00.000Z";
}

export function isValidToken(token: string, prefix: string): boolean {
  return Boolean(token?.startsWith(prefix));
}

export function createErrorResponse(error: string, description?: string): ErrorResponse {
  const response: ErrorResponse = { error };
  if (description) {
    response.error_description = description;
  }
  return response;
}

const JWT_SECRET = "mock_jwt_secret_key_for_development_only";

export function generateMockIdToken(clientId: string): string {
  const payload = {
    iss: "https://accounts.google.com",
    aud: clientId,
    sub: config.mockUser.sub,
    email: config.mockUser.email,
    name: config.mockUser.name,
    given_name: config.mockUser.given_name,
    family_name: config.mockUser.family_name,
    picture: config.mockUser.picture,
    locale: config.mockUser.locale,
  };

  return jwt.sign(payload, JWT_SECRET, { algorithm: "HS256" });
}

export function generateMockLineIdToken(clientId: string, nonce?: string): string {
  const payload = {
    iss: "https://access.line.me",
    aud: clientId,
    sub: config.mockLineUser.userId,
    email: "test@example.com", // LINE OAuth typically doesn't include email, but it may be present in ID tokens
    name: config.mockLineUser.displayName,
    picture: config.mockLineUser.pictureUrl,
    nonce: nonce ?? "mock_nonce_1234567890123456",
  };

  return jwt.sign(payload, JWT_SECRET, { algorithm: "HS256" });
}
