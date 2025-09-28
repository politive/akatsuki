import express from "express";
import type { Request, Response } from "express";
import { URL } from "url";
import { config } from "../config/config.js";
import type { TokenResponse, ErrorResponse, HealthResponse, ServerInfo } from "../lib/types.js";
import {
  generateAuthCode,
  generateAccessToken,
  generateRefreshToken,
  generateMockLineIdToken,
  getCurrentTimestamp,
  isValidToken,
  createErrorResponse,
} from "../lib/utils.js";

interface LineUser {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

const app = express();

const authCodeToNonce = new Map<string, string>();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
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
    service: "LINE OAuth Mock Server",
    timestamp: getCurrentTimestamp(),
  };
  res.json(response);
});

app.get("/", (req: Request, res: Response) => {
  const response: ServerInfo = {
    message: "LINE OAuth Mock Server",
    endpoints: [
      "GET /oauth2/v2.1/authorize - Authorization endpoint",
      "POST /oauth2/v2.1/token - Token endpoint",
      "GET /v2/profile - User info endpoint",
      "GET /health - Health check",
      "GET / - This endpoint",
    ],
  };
  res.json(response);
});

app.get("/oauth2/v2.1/authorize", (req: Request, res: Response) => {
  const { redirect_uri, state, nonce } = req.query;

  const authCode = generateAuthCode();

  if (nonce && typeof nonce === "string") {
    authCodeToNonce.set(authCode, nonce);
  }

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
    nonce: nonce ?? null,
    message: "Mock authorization successful",
  });
});

app.post("/oauth2/v2.1/token", (req: Request, res: Response) => {
  const { grant_type, code, client_id, refresh_token } = req.body;

  if (grant_type === "authorization_code") {
    if (!code?.startsWith("mock_auth_code_")) {
      const errorResponse: ErrorResponse = createErrorResponse("invalid_grant", "Invalid authorization code");
      return res.status(400).json(errorResponse);
    }

    const nonce = authCodeToNonce.get(code) ?? "mock_nonce_1234567890123456";

    authCodeToNonce.delete(code);

    const tokenResponse: TokenResponse = {
      access_token: generateAccessToken(),
      token_type: "Bearer",
      expires_in: config.tokenExpiry,
      refresh_token: generateRefreshToken(),
      scope: "profile openid email",
      id_token: generateMockLineIdToken(client_id ?? "default_client_id", nonce),
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
      scope: "profile openid email",
    };

    return res.json(tokenResponse);
  }
  const errorResponse: ErrorResponse = createErrorResponse("unsupported_grant_type", "Unsupported grant type");
  return res.status(400).json(errorResponse);
});

app.get("/v2/profile", (req: Request, res: Response) => {
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

  const userInfo: LineUser = config.mockLineUser;

  return res.json(userInfo);
});

// Provider not enabled handler
app.use((req: Request, res: Response) => {
  res.status(503).json({
    error: "service_unavailable",
    message: "LINE OAuth provider is not enabled. Please set ENABLE=line environment variable.",
  });
});

app.use((err: Error, req: Request, res: Response) => {
  console.error("Error:", err);
  res.status(500).json({
    error: "internal_server_error",
    message: "An internal server error occurred",
  });
});

export default app;
