import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import AppleProvider from "next-auth/providers/apple"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

const providers: NextAuthOptions["providers"] = []

// Google: prefer standard envs, fallback to ALUDAAI_* if present
const googleClientId = process.env.GOOGLE_CLIENT_ID || process.env.ALUDAAI_GOOGLE_CLIENT_ID
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.ALUDAAI_GOOGLE_CLIENT_SECRET
if (googleClientId && googleClientSecret) {
  providers.push(
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    })
  )
}

// Apple: NextAuth v4 expects a string clientSecret. Only enable when APPLE_SECRET is provided.
const appleId = process.env.APPLE_ID || process.env.ALUDAAI_APPLE_ID
const appleSecret = process.env.APPLE_SECRET || process.env.ALUDAAI_APPLE_SECRET
if (appleId && appleSecret) {
  providers.push(
    AppleProvider({
      clientId: appleId,
      clientSecret: appleSecret,
    })
  )
}

// Credentials (always enabled)
providers.push(
  CredentialsProvider({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" }
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        return null
      }

      const user = await prisma.user.findUnique({ where: { email: credentials.email.toLowerCase() } })
      if (!user || !user.password) {
        return null
      }

      const valid = await bcrypt.compare(credentials.password, user.password)
      if (!valid) return null

      return {
        id: user.id,
        name: user.name || user.username || undefined,
        email: user.email || undefined,
      }
    }
  })
)

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers,
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.name = user.name
        token.email = user.email
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id as string
        session.user.name = token.name as string | null | undefined
        session.user.email = token.email as string | null | undefined

        // Auto-fix session user ID mismatch
        if (session.user.email) {
          try {
            const user = await prisma.user.findUnique({
              where: { email: session.user.email },
              select: { id: true, email: true, plan: true }
            })

            if (user && user.id !== token.id) {
              // Update token with correct user ID
              token.id = user.id
              (session.user as any).id = user.id
              console.log('Session user ID auto-corrected:', {
                oldId: token.id,
                newId: user.id,
                email: session.user.email
              })
            }
          } catch (error) {
            console.error('Session auto-fix error:', error)
          }
        }
      }
      return session
    }
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET || process.env.ALUDAAI_NEXTAUTH_SECRET,
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.ALUDAAI_NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
}
