import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { sendPasswordResetEmail } from "./services/email";

export const auth = betterAuth({
    database: prismaAdapter(db, {
        provider: "postgresql",
    }),
    trustedOrigins: [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        process.env.NEXT_PUBLIC_APP_URL || "",
    ].filter(Boolean),
    emailAndPassword: {   
        enabled: true,
        autoSignIn: true,
        requireEmailVerification: false,
        password: {
            hash: async (password: string) => {
                return bcrypt.hash(password, 10);
            },
            verify: async ({ password, hash }: { password: string; hash: string }) => {
                return bcrypt.compare(password, hash);
            },
        },
        sendResetPassword: async ({ user, url }) => {
            console.log("[Auth] Sending password reset email to:", user.email);
            console.log("[Auth] Reset URL:", url);
            try {
                const result = await sendPasswordResetEmail(user.email, user.name || "User", url);
                console.log("[Auth] Password reset email sent:", result);
                if (!result) {
                    throw new Error("Email service returned false");
                }
            } catch (error) {
                console.error("[Auth] Failed to send password reset email:", error);
                throw error;
            }
        },
    },
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // 1 day
        cookieCache: {
            enabled: true,
            maxAge: 60 // 1 minute cache
        }
    },
    user: {
        additionalFields: {
            role: {
                type: "string",
                required: false,
                defaultValue: "GATE_OFFICER",
            },
            branchId: {
                type: "string",
                required: false,
            },
            phone: {
                type: "string",
                required: false,
            },
            isActive: {
                type: "boolean",
                required: false,
                defaultValue: true,
            },
        },
    },
    plugins: [
        nextCookies(),
    ]
});

export type Session = typeof auth.$Infer.Session;