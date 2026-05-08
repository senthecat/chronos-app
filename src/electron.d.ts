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
  canvasFetchAll: (
    url: string,
    token: string,
    path: string
  ) => Promise<unknown[]>
  flashFrame: () => Promise<void>
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}

export {}
