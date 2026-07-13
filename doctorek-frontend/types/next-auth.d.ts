import type { DefaultSession } from 'next-auth'

type Role = 'ADMIN' | 'MEDECIN' | 'PATIENT'

declare module 'next-auth' {
  interface Session {
    accessToken?: string
    error?: string
    user: DefaultSession['user'] & {
      id: string
      role: Role
      firstName?: string
      lastName?: string
      avatarUrl?: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string
    refreshToken?: string
    idToken?: string
    accessTokenExpires?: number
    role?: Role
    userId?: string
    firstName?: string
    lastName?: string
    avatarUrl?: string
    error?: string
  }
}
