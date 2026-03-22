import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { anonymous } from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { db } from "@/db";

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
	}),
	emailAndPassword: {
		enabled: true,
	},
	plugins: [
		anonymous({
			onLinkAccount: async ({ anonymousUser: _anonymousUser, newUser: _newUser }) => {
				// TODO: migrate anonymous user's data (leagues, teams, picks) to the new account
			},
		}),
		tanstackStartCookies(),
	],
});
