import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Skip auth check for static assets and favicon
  const pathname = request.nextUrl.pathname
  if (
    pathname.startsWith('/_next') ||
    pathname.includes('/favicon.ico') ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp)$/)
  ) {
    return supabaseResponse
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Fast check: If there are no sb- auth cookies at all and user is on a public page, don't stall with remote fetch
  const hasAuthCookies = request.cookies.getAll().some(c => c.name.startsWith('sb-'))
  const isDashboardRoute = pathname.startsWith('/dashboard')
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register')

  if (!hasAuthCookies && !isDashboardRoute) {
    return supabaseResponse
  }

  try {
    // Timeout promise to prevent 30-second freezes if Supabase is offline/paused
    const userPromise = supabase.auth.getUser()
    const timeoutPromise = new Promise<{ data: { user: null }; error: any }>((_, reject) =>
      setTimeout(() => reject(new Error('Auth request timed out (Supabase paused or unreachable)')), 4000)
    )

    const result = await Promise.race([userPromise, timeoutPromise])
    const user = result.data?.user

    if (isDashboardRoute && !user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    if (isAuthRoute && user) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  } catch (err) {
    console.warn('Middleware auth check warning:', err)
    if (isDashboardRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/login?message=Database connection timed out. Please check your Supabase project status.'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
