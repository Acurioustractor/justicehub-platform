import { db } from '@/server/db';
import { users } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import NextAuth, { NextAuthOptions } from 'next-auth';
import Auth0Provider from 'next-auth/providers/auth0';

export const authOptions: NextAuthOptions = {
  providers: [
    Auth0Provider({
      clientId: process.env.AUTH0_CLIENT_ID || '',
      clientSecret: process.env.AUTH0_CLIENT_SECRET || '',
      issuer: process.env.AUTH0_ISSUER_BASE_URL || '',
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (account && user) {
        token.accessToken = account.access_token;
        
        // On sign-in, find or create user in our database
        const auth0Id = user.id; // user.id from provider is the auth0 sub
        
        let dbUser = await db.query.users.findFirst({
          where: eq(users.auth0Id, auth0Id),
        });

        if (!dbUser) {
          const [newUser] = await db
            .insert(users)
            .values({
              auth0Id: auth0Id,
              email: user.email,
              name: user.name,
              role: 'youth', // default role
            })
            .returning();
          dbUser = newUser;
        }
        
        token.id = dbUser.id; // Add our internal ID to the token
        token.role = dbUser.role;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      if (session.user) {
        session.user.id = token.id; // Use our internal ID
        session.user.role = token.role;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions); 