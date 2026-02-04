import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

// Get redirect URI based on request origin
// If NGROK_URL is set and origin is localhost, use ngrok URL
// Otherwise use the request origin
function getRedirectUri(origin: string): string {
  const ngrokUrl = process.env.NGROK_URL
  // If we have ngrok URL and origin is localhost, use ngrok
  if (ngrokUrl && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
    return `${ngrokUrl}/api/auth/tesla/callback`
  }
  return `${origin}/api/auth/tesla/callback`
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const origin = requestUrl.origin
  const redirectUri = getRedirectUri(origin)
  
  // Generate state for CSRF protection
  const state = randomBytes(32).toString('hex')
  
  // Store state in a cookie or session (simplified here)
  const response = NextResponse.redirect(
    `https://auth.tesla.com/oauth2/v3/authorize?` +
    `client_id=${process.env.NEXT_PUBLIC_TESLA_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=code&` +
    `scope=openid%20user_data%20offline_access&` +
    `state=${state}`
  )
  
  // Store state in cookie
  response.cookies.set('tesla_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
    path: '/', // Ensure cookie is available on all paths
  })
  
  return response
}

