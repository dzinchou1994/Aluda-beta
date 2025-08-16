import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import AppleProvider from "next-auth/providers/apple"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.ALUDAAI_GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.ALUDAAI_GOOGLE_CLIENT_SECRET || "",
    }),
    AppleProvider({
      clientId: process.env.ALUDAAI_APPLE_ID || "",
      clientSecret: process.env.ALUDAAI_APPLE_SECRET || "",
    }),
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
  ],
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
      if (token) {
        session.user.id = token.id as string
        session.user.name = token.name as string
        session.user.email = token.email as string
      }
      return session
    }
  },
  jwt: {
    secret: process.env.ALUDAAI_NEXTAUTH_SECRET || process.env.NEXTAUTH_SECRET,
  },
  secret: process.env.ALUDAAI_NEXTAUTH_SECRET || process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
}
