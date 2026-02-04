import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { randomBytes } from 'crypto'

const TESLA_CLIENT_ID = process.env.NEXT_PUBLIC_TESLA_CLIENT_ID
const TESLA_CLIENT_SECRET = process.env.TESLA_CLIENT_SECRET

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

// Get public URL for redirects
// If NGROK_URL is set and origin is localhost, use ngrok URL
// Otherwise use the request origin
function getPublicUrl(origin: string): string {
  const ngrokUrl = process.env.NGROK_URL
  // If we have ngrok URL and origin is localhost, use ngrok
  if (ngrokUrl && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
    return ngrokUrl
  }
  return origin
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const origin = requestUrl.origin
  const code = requestUrl.searchParams.get('code')
  const state = requestUrl.searchParams.get('state')
  const cookieStore = await cookies()
  const storedState = cookieStore.get('tesla_oauth_state')?.value

  const redirectUri = getRedirectUri(origin)
  const publicUrl = getPublicUrl(origin)

  // Verify state
  if (!state || state !== storedState) {
    return NextResponse.redirect(new URL('/?error=invalid_state', publicUrl))
  }

  if (!code) {
    return NextResponse.redirect(new URL('/?error=no_code', publicUrl))
  }

  // Validate required environment variables
  if (!TESLA_CLIENT_ID || !TESLA_CLIENT_SECRET) {
    console.error('Missing Tesla OAuth credentials')
    return NextResponse.redirect(new URL('/?error=missing_credentials', publicUrl))
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://auth.tesla.com/oauth2/v3/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: TESLA_CLIENT_ID,
        client_secret: TESLA_CLIENT_SECRET,
        code: code,
        redirect_uri: redirectUri,
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Token exchange failed:', errorText)
      return NextResponse.redirect(new URL(`/?error=token_exchange_failed&details=${encodeURIComponent(errorText)}`, publicUrl))
    }

    const tokenData = await tokenResponse.json()
    console.log('Token exchange successful')
    
    // Decode ID token to get basic user info
    let idTokenData: any = {}
    if (tokenData.id_token) {
      try {
        const base64Url = tokenData.id_token.split('.')[1]
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        }).join(''))
        idTokenData = JSON.parse(jsonPayload)
        console.log('ID token data:', idTokenData)
      } catch (e) {
        console.error('Failed to decode ID token:', e)
        return NextResponse.redirect(new URL('/?error=invalid_token', publicUrl))
      }
    }

    // Fetch user data from Tesla Fleet API
    let fleetApiData: any = null
    try {
      const fleetApiResponse = await fetch('https://fleet-api.prd.na.vn.cloud.tesla.com/api/1/users/me', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
        },
      })

      if (fleetApiResponse.ok) {
        fleetApiData = await fleetApiResponse.json()
        console.log('User data from Fleet API:', fleetApiData)
      } else {
        const errorText = await fleetApiResponse.text()
        console.warn('Fleet API call failed:', fleetApiResponse.status, errorText)
        // If Fleet API fails, we can't proceed - we need this data
        return NextResponse.redirect(new URL('/?error=fleet_api_failed', publicUrl))
      }
    } catch (apiError) {
      console.error('Error fetching user data from Fleet API:', apiError)
      // If Fleet API fails, we can't proceed - we need this data
      return NextResponse.redirect(new URL('/?error=fleet_api_error', publicUrl))
    }

    // Extract data from Fleet API response structure
    // Fleet API returns data nested under 'response' key
    const fleetUserData = fleetApiData?.response || fleetApiData
    console.log('Extracted fleetUserData:', fleetUserData)
    
    if (!fleetUserData) {
      console.error('Invalid Fleet API response structure:', fleetApiData)
      return NextResponse.redirect(new URL('/?error=invalid_fleet_response', publicUrl))
    }

    // Use email from Fleet API - this is required and is the real email
    const email = fleetUserData.email
    console.log('Email from Fleet API:', email)
    
    if (!email || !email.includes('@')) {
      console.error('No valid email from Fleet API. Response:', fleetUserData)
      return NextResponse.redirect(new URL('/?error=no_email_from_fleet', publicUrl))
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.error('Invalid email format:', email)
      return NextResponse.redirect(new URL(`/?error=invalid_email&email=${encodeURIComponent(email)}`, publicUrl))
    }

    console.log('Processing user with email from Fleet API:', email)
    console.log('Full name from Fleet API:', fleetUserData.full_name)

    // Use Admin API to handle user creation/sign-in
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('SUPABASE_SERVICE_ROLE_KEY not set')
      return NextResponse.redirect(new URL('/?error=server_config', publicUrl))
    }

    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Check if user exists
    const { data: usersData, error: listError } = await adminClient.auth.admin.listUsers()
    if (listError) {
      console.error('Error listing users:', listError)
      return NextResponse.redirect(new URL('/?error=list_users_failed', publicUrl))
    }

    const existingUser = usersData?.users?.find(u => u.email === email)
    let userId: string

    if (existingUser) {
      // User exists - just confirm them and update access token
      // Don't overwrite existing user metadata (name, etc.) since we already have it
      console.log('User exists, updating:', existingUser.id)
      userId = existingUser.id
      
      // Update user metadata (without sensitive token)
      // Remove tesla_access_token from metadata if it exists (migration cleanup)
      const { tesla_access_token, ...cleanMetadata } = existingUser.user_metadata || {}
      
      const { error: updateError } = await adminClient.auth.admin.updateUserById(userId, {
        email_confirm: true,
        user_metadata: cleanMetadata, // Preserve existing metadata without token
      })

      if (updateError) {
        console.error('Error updating user:', updateError)
        return NextResponse.redirect(new URL('/?error=update_user_failed', publicUrl))
      }

      // Store token securely in database table (server-side only)
      const expiresAt = tokenData.expires_in 
        ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
        : null

      const { error: tokenUpdateError } = await adminClient
        .from('tesla_user_access_tokens')
        .upsert({
          user_id: userId,
          tesla_access_token: tokenData.access_token,
          tesla_refresh_token: tokenData.refresh_token || null,
          expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        })

      if (tokenUpdateError) {
        console.error('Error storing token:', tokenUpdateError)
        // Don't fail the flow, but log the error
      }
    } else {
      // Create new user - use data from Fleet API
      console.log('Creating new user with Fleet API data')
      const randomPassword = randomBytes(32).toString('hex')
      
      // Extract name from Fleet API response
      const fullName = fleetUserData.full_name || 'Tesla User'
      
      console.log('Creating user with:', { email, fullName })
      
      const { data: createData, error: createError } = await adminClient.auth.admin.createUser({
        email: email,
        password: randomPassword,
        email_confirm: true, // Auto-confirm
        user_metadata: {
          full_name: fullName,
          tesla_id: idTokenData.sub,
          // DO NOT store tesla_access_token in user_metadata (security risk)
          vault_uuid: fleetUserData.vault_uuid,
          profile_image_url: fleetUserData.profile_image_url,
        }
      })

      if (createError || !createData.user) {
        console.error('Error creating user:', createError)
        return NextResponse.redirect(new URL('/?error=create_user_failed', publicUrl))
      }

      userId = createData.user.id
      console.log('User created:', userId)

      // Store token securely in database table (server-side only)
      const expiresAt = tokenData.expires_in 
        ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
        : null

      const { error: tokenInsertError } = await adminClient
        .from('tesla_user_access_tokens')
        .insert({
          user_id: userId,
          tesla_access_token: tokenData.access_token,
          tesla_refresh_token: tokenData.refresh_token || null,
          expires_at: expiresAt,
        })

      if (tokenInsertError) {
        console.error('Error storing token:', tokenInsertError)
        // Don't fail the flow, but log the error
      }
    }

    // Generate a session for the user
    const { data: sessionData, error: sessionError } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
    })

    if (sessionError || !sessionData) {
      console.error('Error generating session:', sessionError)
      return NextResponse.redirect(new URL('/?error=session_failed', publicUrl))
    }

    // Extract the token from the magic link
    const magicLink = new URL(sessionData.properties.action_link)
    const token = magicLink.searchParams.get('token') || magicLink.hash.split('=')[1]

    if (!token) {
      console.error('No token in magic link')
      return NextResponse.redirect(new URL('/?error=no_token', publicUrl))
    }

    // Use the regular client to exchange the token for a session
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'magiclink'
    })

    if (authError) {
      console.error('Error verifying token:', authError)
      // Fallback: redirect to sign in page with email
      return NextResponse.redirect(new URL(`/?tesla_signin=success&email=${encodeURIComponent(email)}`, publicUrl))
    }

    // Success - user is signed in
    const response = NextResponse.redirect(new URL('/?tesla_signin=success', publicUrl))
    response.cookies.delete('tesla_oauth_state')
    return response

  } catch (error: any) {
    console.error('Tesla OAuth error:', error)
    return NextResponse.redirect(new URL(`/?error=oauth_failed&details=${encodeURIComponent(error.message || 'Unknown error')}`, publicUrl))
  }
}
