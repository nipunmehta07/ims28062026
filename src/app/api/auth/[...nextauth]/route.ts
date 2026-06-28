import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { username: credentials.username }
        });

        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(credentials.password, user.password);
        
        // Return the user object including the role from your schema [cite: 16, 17]
        if (isValid) {
          return {
            id: user.id,
            name: user.name ?? "",
            username: user.username ?? "",
            role: user.role, // This comes from your updated schema 
          };
        }
        return null;
      }
    })
  ],
  callbacks: {
    // 1. Attach the role to the JWT token when logging in
    async jwt({ token, user }: any) {
      if (user) {
        token.role = user.role;
		token.username = user.username; // Ensure this is present
      }
      return token;
    },
    // 2. Attach the role from the token to the session accessible in the UI
    async session({ session, token }: any) {
      if (session.user) {
        session.user.role = token.role;
		session.user.username = token.username; 
  }
      return session;
    }
  },
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
});

export { handler as GET, handler as POST };