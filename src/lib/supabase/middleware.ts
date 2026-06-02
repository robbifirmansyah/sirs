import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const url = request.nextUrl.clone()

  // If there is no user and they are trying to access protected routes
  if (!user && (request.nextUrl.pathname.startsWith('/rs') || request.nextUrl.pathname.startsWith('/dinkes'))) {
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // Role-based routing protection
  if (user) {
    const role = user.user_metadata?.role

    // If on login page, redirect based on role
    if (request.nextUrl.pathname === '/') {
      if (role === 'rs') {
        url.pathname = '/rs/riwayat'
        return NextResponse.redirect(url)
      } else if (role === 'dinkes') {
        url.pathname = '/dinkes/dashboard'
        return NextResponse.redirect(url)
      }
    }

    // Block cross-role access
    if (request.nextUrl.pathname.startsWith('/rs') && role !== 'rs') {
      url.pathname = role === 'dinkes' ? '/dinkes/dashboard' : '/'
      return NextResponse.redirect(url)
    }

    if (request.nextUrl.pathname.startsWith('/dinkes') && role !== 'dinkes') {
      url.pathname = role === 'rs' ? '/rs/riwayat' : '/'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
