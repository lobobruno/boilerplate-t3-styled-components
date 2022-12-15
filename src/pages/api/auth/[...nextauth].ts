import NextAuth, { type NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
// Prisma adapter for NextAuth, optional and can be removed
import { PrismaAdapter } from '@next-auth/prisma-adapter'

import { env } from '../../../env/server.mjs'
import { prisma } from '../../../server/db/client'

export const authOptions: NextAuthOptions = {
	// Include user.id on session

	// Configure one or more authentication providers
	adapter: PrismaAdapter(prisma),
	providers: [
		GoogleProvider({
			clientId: env.GOOGLE_CLIENT_ID,
			clientSecret: env.GOOGLE_CLIENT_SECRET
		})
		// ...add more providers here
	],
	secret: process.env.NEXTAUTH_SECRET,

	session: {
		strategy: 'jwt',
		maxAge: 31 * 24 * 60 * 60 // 30 days
	},

	jwt: {
		secret: process.env.NEXTAUTH_SECRET
	},

	pages: {
		//signIn: '/auth/signin',
		//error: '/auth/signin'
	},

	// https://next-auth.js.org/configuration/callbacks
	callbacks: {
		redirect: async ({ url }) => {
			return Promise.resolve(url)
		},
		async signIn({ account, profile }) {
			if (account?.provider === 'google') {
				return true
				//if (profile?.email) return allowed.indexOf(profile.email.toLowerCase()) >= 0
			}
			return false
		},
		async jwt({ token, user, account, profile, isNewUser }) {
			// Since you are using Credentials' provider, the data you're persisting
			// _should_ reside in the user here (as far as can I see, since I've just tested it out).
			// This gets called whenever a JSON Web Token is created (once) or updated
			if (user?.email) {
				const dbUser = await prisma.user.findFirst({
					where: { email: token.email }
				})
				if (dbUser) {
					if (dbUser.id) token.id = dbUser.id
				}
			}
			return token
		},

		async session({ session, token }) {
			if (session.user) {
				session.user.id = token.id + ''
			}
			if (token.email) {
				const dbUser = await prisma.user.findFirst({
					where: { email: token.email }
				})
				if (dbUser && dbUser.id) {
					const user = {
						id: dbUser.id
					}
					session.user = { ...session.user, ...user }
				}
			}

			return Promise.resolve(session)
		}
	},

	// Events are useful for logging
	// https://next-auth.js.org/configuration/events
	events: {
		createUser: async ({ user }) => {
			return
		}
	},

	// Enable debug messages in the console if you are having problems
	debug: false
}

export default NextAuth(authOptions)
