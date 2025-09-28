import request from "supertest";
import googleApp from "../google/app.js";
import lineApp from "../line/app.js";

describe("OAuth Integration Tests", () => {
  describe("Google OAuth Flow", () => {
    it("should complete full OAuth flow", async () => {
      // 1. Authorization request
      const authResponse = await request(googleApp)
        .get("/o/oauth2/v2/auth")
        .query({
          response_type: "code",
          client_id: "test_client",
          scope: "openid email profile",
          state: "test_state_123",
        })
        .expect(200);

      const authCode = authResponse.body.code;
      expect(authCode).toMatch(/^mock_auth_code_/);

      // 2. Token exchange
      const tokenResponse = await request(googleApp)
        .post("/token")
        .send({
          grant_type: "authorization_code",
          code: authCode,
          client_id: "test_client",
          client_secret: "test_secret",
          redirect_uri: "http://localhost:3000/callback",
        })
        .expect(200);

      const { access_token, id_token } = tokenResponse.body;
      expect(access_token).toMatch(/^mock_access_token_/);
      expect(id_token).toBeDefined();

      // 3. Get user info
      const userResponse = await request(googleApp)
        .get("/oauth2/v2/userinfo")
        .set("Authorization", `Bearer ${access_token}`)
        .expect(200);

      expect(userResponse.body).toMatchObject({
        sub: "1234567890123456789012",
        email: "test@example.com",
        name: "Yamada Taro",
      });
    });
  });

  describe("LINE OAuth Flow", () => {
    it("should complete full OAuth flow with nonce", async () => {
      const nonce = "test_nonce_123";
      const state = "test_state_123";

      // 1. Authorization request (with nonce)
      const authResponse = await request(lineApp)
        .get("/oauth2/v2.1/authorize")
        .query({
          response_type: "code",
          client_id: "test_client",
          scope: "profile openid email",
          state,
          nonce,
        })
        .expect(200);

      const authCode = authResponse.body.code;
      expect(authCode).toMatch(/^mock_auth_code_/);

      // 2. Token exchange
      const tokenResponse = await request(lineApp)
        .post("/oauth2/v2.1/token")
        .send({
          grant_type: "authorization_code",
          code: authCode,
          client_id: "test_client",
          client_secret: "test_secret",
          redirect_uri: "http://localhost:3000/callback",
        })
        .expect(200);

      const { access_token, id_token } = tokenResponse.body;
      expect(access_token).toMatch(/^mock_access_token_/);
      expect(id_token).toBeDefined();

      // 3. Verify nonce in ID token
      const payload = JSON.parse(Buffer.from(id_token.split(".")[1], "base64").toString());
      expect(payload.nonce).toBe(nonce);

      // 4. Get user profile
      const profileResponse = await request(lineApp)
        .get("/v2/profile")
        .set("Authorization", `Bearer ${access_token}`)
        .expect(200);

      expect(profileResponse.body).toMatchObject({
        userId: "U12345678901234567890123456789012",
        displayName: "Yamada Taro",
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid auth codes", async () => {
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

      expect(response.body.error).toBe("invalid_grant");
    });

    it("should handle invalid access tokens", async () => {
      const response = await request(googleApp)
        .get("/oauth2/v2/userinfo")
        .set("Authorization", "Bearer invalid_token")
        .expect(401);

      expect(response.body.error).toBe("unauthorized");
    });

    it("should handle missing authorization header", async () => {
      const response = await request(googleApp).get("/oauth2/v2/userinfo").expect(401);

      expect(response.body.error).toBe("unauthorized");
    });
  });

  describe("CORS Support", () => {
    it("should handle OPTIONS requests", async () => {
      await request(googleApp).options("/oauth2/v2/userinfo").expect(200);
    });

    it("should include CORS headers", async () => {
      const response = await request(googleApp).get("/health");

      expect(response.headers["access-control-allow-origin"]).toBe("*");
      expect(response.headers["access-control-allow-methods"]).toContain("GET");
    });
  });
});
