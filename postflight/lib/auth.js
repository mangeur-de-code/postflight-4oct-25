import NextAuth from 'next-auth'
import GoogleProvider from '@auth/core/providers/google'

export const options = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      session.user.id = token.sub;
      return session;
    },
  },
  pages: {
    signIn: '/api/auth/signin',
    signOut: '/api/auth/signout',
  },
}

export const { handlers, auth, signIn, signOut } = NextAuth(options);