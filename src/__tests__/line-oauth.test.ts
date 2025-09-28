import request from "supertest";
import lineApp from "../line/app.js";

describe("LINE OAuth Mock Server", () => {
  describe("GET /health", () => {
    it("should return health status", async () => {
      const response = await request(lineApp).get("/health").expect(200);

      expect(response.body).toMatchObject({
        status: "healthy",
        service: "LINE OAuth Mock Server",
        timestamp: expect.any(String),
      });
    });
  });

  describe("GET /", () => {
    it("should return server info", async () => {
      const response = await request(lineApp).get("/").expect(200);

      expect(response.body).toMatchObject({
        message: "LINE OAuth Mock Server",
        endpoints: expect.arrayContaining([
          "GET /oauth2/v2.1/authorize - Authorization endpoint",
          "POST /oauth2/v2.1/token - Token endpoint",
          "GET /v2/profile - User info endpoint",
          "GET /health - Health check",
          "GET / - This endpoint",
        ]),
      });
    });
  });

  describe("GET /oauth2/v2.1/authorize", () => {
    it("should redirect with auth code when redirect_uri is provided", async () => {
      const redirectUri = "http://localhost:3000/callback";
      const state = "test_state_123";
      const nonce = "test_nonce_123";

      const response = await request(lineApp)
        .get("/oauth2/v2.1/authorize")
        .query({
          redirect_uri: redirectUri,
          state,
          nonce,
          response_type: "code",
          client_id: "test_client",
          scope: "profile openid email",
        })
        .expect(302);

      expect(response.headers.location).toContain(redirectUri);
      expect(response.headers.location).toContain("code=");
      expect(response.headers.location).toContain(`state=${state}`);
    });

    it("should return JSON when redirect_uri is not provided", async () => {
      const nonce = "test_nonce_123";

      const response = await request(lineApp)
        .get("/oauth2/v2.1/authorize")
        .query({
          response_type: "code",
          client_id: "test_client",
          scope: "profile openid email",
          nonce,
        })
        .expect(200);

      expect(response.body).toMatchObject({
        code: expect.stringMatching(/^mock_auth_code_/),
        state: null,
        nonce,
        message: "Mock authorization successful",
      });
    });
  });

  describe("POST /oauth2/v2.1/token", () => {
    it("should exchange auth code for token with nonce", async () => {
      // First, generate auth code (associate with nonce)
      const nonce = "test_nonce_123";
      const authResponse = await request(lineApp)
        .get("/oauth2/v2.1/authorize")
        .query({
          response_type: "code",
          client_id: "test_client",
          scope: "profile openid email",
          nonce,
        })
        .expect(200);

      const authCode = authResponse.body.code;

      // Token exchange
      const response = await request(lineApp)
        .post("/oauth2/v2.1/token")
        .send({
          grant_type: "authorization_code",
          code: authCode,
          client_id: "test_client",
          client_secret: "test_secret",
          redirect_uri: "http://localhost:3000/callback",
        })
        .expect(200);

      expect(response.body).toMatchObject({
        access_token: expect.stringMatching(/^mock_access_token_/),
        token_type: "Bearer",
        expires_in: 3600,
        refresh_token: expect.stringMatching(/^mock_refresh_token_/),
        scope: "profile openid email",
        id_token: expect.any(String),
      });

      // Decode ID token and verify nonce
      const idToken = response.body.id_token;
      const payload = JSON.parse(Buffer.from(idToken.split(".")[1], "base64").toString());
      expect(payload.nonce).toBe(nonce);
    });

    it("should handle refresh token flow", async () => {
      const response = await request(lineApp)
        .post("/oauth2/v2.1/token")
        .send({
          grant_type: "refresh_token",
          refresh_token: "mock_refresh_token_test123",
        })
        .expect(200);

      expect(response.body).toMatchObject({
        access_token: expect.stringMatching(/^mock_access_token_/),
        token_type: "Bearer",
        expires_in: 3600,
        scope: "profile openid email",
      });
    });

    it("should return error for invalid auth code", async () => {
      const response = await request(lineApp)
        .post("/oauth2/v2.1/token")
        .send({
          grant_type: "authorization_code",
          code: "invalid_code",
          client_id: "test_client",
          client_secret: "test_secret",
          redirect_uri: "http://localhost:3000/callback",
        })
        .expect(400);

      expect(response.body).toMatchObject({
        error: "invalid_grant",
        error_description: "Invalid authorization code",
      });
    });
  });

  describe("GET /v2/profile", () => {
    it("should return user profile with valid access token", async () => {
      const response = await request(lineApp)
        .get("/v2/profile")
        .set("Authorization", "Bearer mock_access_token_test123")
        .expect(200);

      expect(response.body).toMatchObject({
        userId: "U12345678901234567890123456789012",
        displayName: "Yamada Taro",
        pictureUrl: "https://example.com/image.png",
        statusMessage: "Hello, LINE!",
      });
    });

    it("should return error without authorization header", async () => {
      const response = await request(lineApp).get("/v2/profile").expect(401);

      expect(response.body).toMatchObject({
        error: "unauthorized",
        error_description: "Missing or invalid authorization header",
      });
    });

    it("should return error with invalid access token", async () => {
      const response = await request(lineApp)
        .get("/v2/profile")
        .set("Authorization", "Bearer invalid_token")
        .expect(401);

      expect(response.body).toMatchObject({
        error: "unauthorized",
        error_description: "Invalid access token",
      });
    });
  });
});
