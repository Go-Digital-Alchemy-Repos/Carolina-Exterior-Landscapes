import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "../db";
import { passwordResetTokens, users, type User, type InsertUser } from "@shared/schema";
import type { UserRole } from "@shared/types";

type UserInsertData = typeof users.$inferInsert;

export class UserStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(data: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(data as UserInsertData).returning();
    return user;
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...(data as Partial<UserInsertData>), updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updatePasswordAndRevokeSessions(id: string, password: string): Promise<User | undefined> {
    return db.transaction(async (tx) => {
      const [user] = await tx
        .update(users)
        .set({
          password,
          sessionVersion: sql`${users.sessionVersion} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(users.id, id))
        .returning();
      await tx
        .update(passwordResetTokens)
        .set({ usedAt: new Date() })
        .where(and(eq(passwordResetTokens.userId, id), isNull(passwordResetTokens.usedAt)));
      return user;
    });
  }

  async setSuspendedAndRevokeSessions(id: string, isSuspended: boolean): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({
        isSuspended,
        sessionVersion: sql`${users.sessionVersion} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return db.select().from(users).where(eq(users.role, role));
  }

  async getUsersByRoles(roles: UserRole[]): Promise<User[]> {
    return db.select().from(users).where(inArray(users.role, roles));
  }

  async countUsersByRole(role: UserRole): Promise<number> {
    const matching = await db.select({ id: users.id }).from(users).where(eq(users.role, role));
    return matching.length;
  }

  async getFormNotificationUsers(formId: string): Promise<User[]> {
    const systemUsers = await this.getUsersByRoles(["admin", "editor"]);
    return systemUsers.filter((user) =>
      !user.isSuspended &&
      Array.isArray(user.formNotificationFormIds) &&
      user.formNotificationFormIds.includes(formId)
    );
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }
}
