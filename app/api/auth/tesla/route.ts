import { NextResponse } from 'next/server'

const TESLA_REDIRECT_URI = 'https://splashy-frieda-vibrationless.ngrok-free.dev/api/auth/tesla/callback'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const origin = requestUrl.origin
  
  // Generate state for CSRF protection
  const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

  console.log(encodeURIComponent(TESLA_REDIRECT_URI))
  
  // Store state in a cookie or session (simplified here)
  const response = NextResponse.redirect(
    `https://auth.tesla.com/oauth2/v3/authorize?` +
    `client_id=${process.env.NEXT_PUBLIC_TESLA_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(TESLA_REDIRECT_URI)}&` +
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

