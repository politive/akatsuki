import request from "supertest";
import googleApp from "../google/app.js";

describe("Google OAuth Mock Server", () => {
  describe("GET /health", () => {
    it("should return health status", async () => {
      const response = await request(googleApp).get("/health").expect(200);

      expect(response.body).toMatchObject({
        status: "healthy",
        service: "Google OAuth Mock Server",
        timestamp: expect.any(String),
      });
    });
  });

  describe("GET /", () => {
    it("should return server info", async () => {
      const response = await request(googleApp).get("/").expect(200);

      expect(response.body).toMatchObject({
        message: "Google OAuth Mock Server",
        endpoints: expect.arrayContaining([
          "GET /o/oauth2/v2/auth - Authorization endpoint",
          "POST /token - Token endpoint",
          "GET /oauth2/v2/userinfo - User info endpoint",
          "GET /health - Health check",
          "GET / - This endpoint",
        ]),
      });
    });
  });

  describe("GET /o/oauth2/v2/auth", () => {
    it("should redirect with auth code when redirect_uri is provided", async () => {
      const redirectUri = "http://localhost:3000/callback";
      const state = "test_state_123";

      const response = await request(googleApp)
        .get("/o/oauth2/v2/auth")
        .query({
          redirect_uri: redirectUri,
          state,
          response_type: "code",
          client_id: "test_client",
          scope: "openid email profile",
        })
        .expect(302);

      expect(response.headers.location).toContain(redirectUri);
      expect(response.headers.location).toContain("code=");
      expect(response.headers.location).toContain(`state=${state}`);
    });

    it("should return JSON when redirect_uri is not provided", async () => {
      const response = await request(googleApp)
        .get("/o/oauth2/v2/auth")
        .query({
          response_type: "code",
          client_id: "test_client",
          scope: "openid email profile",
        })
        .expect(200);

      expect(response.body).toMatchObject({
        code: expect.stringMatching(/^mock_auth_code_/),
        state: null,
        message: "Mock authorization successful",
      });
    });
  });

  describe("POST /token", () => {
    it("should exchange auth code for token", async () => {
      const response = await request(googleApp)
        .post("/token")
        .send({
          grant_type: "authorization_code",
          code: "mock_auth_code_test123",
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
        scope: "openid email profile",
        id_token: expect.any(String),
      });
    });

    it("should handle refresh token flow", async () => {
      const response = await request(googleApp)
        .post("/token")
        .send({
          grant_type: "refresh_token",
          refresh_token: "mock_refresh_token_test123",
        })
        .expect(200);

      expect(response.body).toMatchObject({
        access_token: expect.stringMatching(/^mock_access_token_/),
        token_type: "Bearer",
        expires_in: 3600,
        scope: "openid email profile",
      });
    });

    it("should return error for invalid auth code", async () => {
      const response = await request(googleApp)
        .post("/token")
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

  describe("GET /oauth2/v2/userinfo", () => {
    it("should return user info with valid access token", async () => {
      const response = await request(googleApp)
        .get("/oauth2/v2/userinfo")
        .set("Authorization", "Bearer mock_access_token_test123")
        .expect(200);

      expect(response.body).toMatchObject({
        sub: "1234567890123456789012",
        email: "test@example.com",
        email_verified: true,
        name: "Yamada Taro",
        given_name: "Taro",
        family_name: "Yamada",
        picture: "https://example.com/image.png",
        locale: "ja",
      });
    });

    it("should return error without authorization header", async () => {
      const response = await request(googleApp).get("/oauth2/v2/userinfo").expect(401);

      expect(response.body).toMatchObject({
        error: "unauthorized",
        error_description: "Missing or invalid authorization header",
      });
    });

    it("should return error with invalid access token", async () => {
      const response = await request(googleApp)
        .get("/oauth2/v2/userinfo")
        .set("Authorization", "Bearer invalid_token")
        .expect(401);

      expect(response.body).toMatchObject({
        error: "unauthorized",
        error_description: "Invalid access token",
      });
    });
  });
});
