import {
  generateAuthCode,
  generateAccessToken,
  generateRefreshToken,
  generateMockIdToken,
  generateMockLineIdToken,
  getCurrentTimestamp,
  isValidToken,
  createErrorResponse,
} from "../lib/utils.js";

describe("Utils", () => {
  describe("generateAuthCode", () => {
    it("should generate auth code with correct prefix", () => {
      const result = generateAuthCode();
      expect(result).toMatch(/^mock_auth_code_/);
    });
  });

  describe("generateAccessToken", () => {
    it("should generate access token with correct prefix", () => {
      const result = generateAccessToken();
      expect(result).toMatch(/^mock_access_token_/);
    });
  });

  describe("generateRefreshToken", () => {
    it("should generate refresh token with correct prefix", () => {
      const result = generateRefreshToken();
      expect(result).toMatch(/^mock_refresh_token_/);
    });
  });

  describe("generateMockIdToken", () => {
    it("should generate Google ID token", () => {
      const result = generateMockIdToken("test_client_id");
      expect(typeof result).toBe("string");

      // Check JWT format (should have 3 parts)
      const parts = result.split(".");
      expect(parts).toHaveLength(3);
    });
  });

  describe("generateMockLineIdToken", () => {
    it("should generate LINE ID token", () => {
      const result = generateMockLineIdToken("test_client_id");
      expect(typeof result).toBe("string");

      // Check JWT format
      const parts = result.split(".");
      expect(parts).toHaveLength(3);
    });

    it("should include nonce in LINE ID token", () => {
      const nonce = "test_nonce_123";
      const result = generateMockLineIdToken("test_client_id", nonce);

      // Decode JWT payload
      const parts = result.split(".");
      const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());
      expect(payload.nonce).toBe(nonce);
    });
  });

  describe("getCurrentTimestamp", () => {
    it("should return fixed timestamp", () => {
      const result = getCurrentTimestamp();
      expect(result).toBe("2024-01-01T00:00:00.000Z");
    });
  });

  describe("isValidToken", () => {
    it("should return true for valid token", () => {
      const result = isValidToken("mock_access_token_123", "mock_access_token_");
      expect(result).toBe(true);
    });

    it("should return false for invalid token", () => {
      const result = isValidToken("invalid_token", "mock_access_token_");
      expect(result).toBe(false);
    });

    it("should return false for empty token", () => {
      const result = isValidToken("", "mock_access_token_");
      expect(result).toBe(false);
    });
  });

  describe("createErrorResponse", () => {
    it("should create error response with error only", () => {
      const result = createErrorResponse("invalid_request");

      expect(result).toEqual({
        error: "invalid_request",
      });
    });

    it("should create error response with error and description", () => {
      const result = createErrorResponse("invalid_request", "Missing required parameter");

      expect(result).toEqual({
        error: "invalid_request",
        error_description: "Missing required parameter",
      });
    });
  });
});
