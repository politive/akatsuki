import express from "express";
import type { NextFunction, Request, Response } from "express";
import { URL } from "url";
import { config } from "../config/config.js";
import type { GoogleUser, TokenResponse, ErrorResponse, HealthResponse, ServerInfo } from "../lib/types.js";
import {
  generateAuthCode,
  generateAccessToken,
  generateRefreshToken,
  generateMockIdToken,
  getCurrentTimestamp,
  isValidToken,
  createErrorResponse,
} from "../lib/utils.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req: Request, res: Response, next: NextFunction) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");

  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.get("/health", (req: Request, res: Response) => {
  const response: HealthResponse = {
    status: "healthy",
    service: "Google OAuth Mock Server",
    timestamp: getCurrentTimestamp(),
  };
  return res.json(response);
});

app.get("/", (req: Request, res: Response) => {
  const response: ServerInfo = {
    message: "Google OAuth Mock Server",
    endpoints: [
      "GET /o/oauth2/v2/auth - Authorization endpoint",
      "POST /token - Token endpoint",
      "GET /oauth2/v2/userinfo - User info endpoint",
      "GET /health - Health check",
      "GET / - This endpoint",
    ],
  };
  return res.json(response);
});

app.get("/o/oauth2/v2/auth", (req: Request, res: Response) => {
  const { redirect_uri, state } = req.query;

  const authCode = generateAuthCode();

  if (redirect_uri && typeof redirect_uri === "string") {
    const redirectUrl = new URL(redirect_uri);
    redirectUrl.searchParams.set("code", authCode);
    if (state && typeof state === "string") {
      redirectUrl.searchParams.set("state", state);
    }

    res.redirect(redirectUrl.toString());
    return;
  }

  return res.json({
    code: authCode,
    state: state ?? null,
    message: "Mock authorization successful",
  });
});

app.post("/token", (req: Request, res: Response) => {
  const { grant_type, code, client_id, refresh_token, scope } = req.body;

  if (grant_type === "authorization_code") {
    if (!code?.startsWith("mock_auth_code_")) {
      const errorResponse: ErrorResponse = createErrorResponse("invalid_grant", "Invalid authorization code");

      return res.status(400).json(errorResponse);
    }

    const responseScope = scope ?? "openid email profile";
    const tokenResponse: TokenResponse = {
      access_token: generateAccessToken(),
      token_type: "Bearer",
      expires_in: config.tokenExpiry,
      refresh_token: generateRefreshToken(),
      scope: responseScope,
      id_token: responseScope.includes("openid") ? generateMockIdToken(client_id ?? "default_client_id") : undefined,
    };

    return res.json(tokenResponse);
  } else if (grant_type === "refresh_token") {
    if (!refresh_token || !isValidToken(refresh_token, config.refreshTokenPrefix)) {
      const errorResponse: ErrorResponse = createErrorResponse("invalid_grant", "Invalid refresh token");

      return res.status(400).json(errorResponse);
    }

    const tokenResponse: TokenResponse = {
      access_token: generateAccessToken(),
      token_type: "Bearer",
      expires_in: config.tokenExpiry,
      scope: "openid email profile",
    };

    return res.json(tokenResponse);
  }
  const errorResponse: ErrorResponse = createErrorResponse("unsupported_grant_type", "Unsupported grant type");

  return res.status(400).json(errorResponse);
});

app.get("/oauth2/v2/userinfo", (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    const errorResponse: ErrorResponse = createErrorResponse("unauthorized", "Missing or invalid authorization header");

    return res.status(401).json(errorResponse);
  }

  const token = authHeader.substring(7);

  if (!isValidToken(token, config.tokenPrefix)) {
    const errorResponse: ErrorResponse = createErrorResponse("unauthorized", "Invalid access token");

    return res.status(401).json(errorResponse);
  }

  const userInfo: GoogleUser = config.mockUser;
  return res.json(userInfo);
});

// Provider not enabled handler
app.use((req: Request, res: Response) => {
  res.status(503).json({
    error: "service_unavailable",
    message: "Google OAuth provider is not enabled. Please set ENABLE=google environment variable.",
  });
});

// error handler
app.use((err: Error, req: Request, res: Response) => {
  console.error("Error:", err);
  res.status(500).json({
    error: "internal_server_error",
    message: "An internal server error occurred",
  });
});

export default app;
