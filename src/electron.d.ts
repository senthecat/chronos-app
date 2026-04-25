import { GoogleTokens } from '@/lib/types'

interface ElectronAPI {
  startGoogleAuth: (
    clientId: string,
    clientSecret: string
  ) => Promise<GoogleTokens>
  refreshGoogleToken: (
    clientId: string,
    clientSecret: string,
    refreshToken: string
  ) => Promise<Pick<GoogleTokens, 'accessToken' | 'expiresAt'>>
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}

export {}
