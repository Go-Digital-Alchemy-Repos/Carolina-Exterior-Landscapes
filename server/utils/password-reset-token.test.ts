import { describe, expect, it } from "vitest";
import { generatePasswordResetToken, hashPasswordResetToken } from "./password-reset-token";

describe("password reset tokens", () => {
  it("generates high-entropy tokens and stores only a deterministic hash", () => {
    const token = generatePasswordResetToken();
    const hash = hashPasswordResetToken(token);
    expect(token).toMatch(/^[a-f0-9]{64}$/);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hash).not.toBe(token);
    expect(hashPasswordResetToken(token)).toBe(hash);
  });
});
