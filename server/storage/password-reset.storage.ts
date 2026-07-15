import { eq, and, isNull, sql } from "drizzle-orm";
import { db } from "../db";
import { passwordResetTokens, users, type PasswordResetToken } from "@shared/schema";
import { generatePasswordResetToken, hashPasswordResetToken } from "../utils/password-reset-token";

export class PasswordResetStorage {
  generateToken(): string {
    return generatePasswordResetToken();
  }

  async createToken(userId: string): Promise<PasswordResetToken> {
    const token = this.generateToken();
    const tokenHash = hashPasswordResetToken(token);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return db.transaction(async (tx) => {
      await tx
        .update(passwordResetTokens)
        .set({ usedAt: new Date() })
        .where(and(eq(passwordResetTokens.userId, userId), isNull(passwordResetTokens.usedAt)));
      const [record] = await tx
        .insert(passwordResetTokens)
        .values({ userId, token: tokenHash, expiresAt })
        .returning();
      return { ...record, token };
    });
  }

  async consumeAndResetPassword(token: string, passwordHash: string): Promise<boolean> {
    const tokenHash = hashPasswordResetToken(token);
    return db.transaction(async (tx) => {
      const result = await tx.execute(sql<{ id: string; user_id: string }>`
        SELECT id, user_id
        FROM password_reset_tokens
        WHERE token = ${tokenHash}
          AND used_at IS NULL
          AND expires_at > now()
        FOR UPDATE
      `);
      const record = result.rows[0] as { id: string; user_id: string } | undefined;
      if (!record) return false;

      await tx
        .update(users)
        .set({
          password: passwordHash,
          sessionVersion: sql`${users.sessionVersion} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(users.id, record.user_id));
      await tx
        .update(passwordResetTokens)
        .set({ usedAt: new Date() })
        .where(and(eq(passwordResetTokens.userId, record.user_id), isNull(passwordResetTokens.usedAt)));
      return true;
    });
  }
}
