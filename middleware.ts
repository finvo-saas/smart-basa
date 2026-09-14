import { NextRequest, NextResponse } from 'next/server'
import {
  defaultLocale,
  isValidLocale,
  LOCALE_COOKIE,
} from '@/lib/i18n/config'
import { canonicalRedirect } from '@/lib/seo/canonical-redirect'
import { shouldNoIndex } from '@/lib/seo/routes'

const ONE_YEAR = 60 * 60 * 24 * 365

export async function middleware(request: NextRequest) {
  const canonical = await canonicalRedirect(request)
  if (canonical) return canonical

  const response = NextResponse.next()
  const current = request.cookies.get(LOCALE_COOKIE)?.value

  if (!current || !isValidLocale(current)) {
    response.cookies.set(LOCALE_COOKIE, defaultLocale, {
      path: '/',
      maxAge: ONE_YEAR,
      sameSite: 'lax',
    })
  }

  if (shouldNoIndex(request.nextUrl.pathname)) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  } else if (
    request.nextUrl.pathname === '/search' &&
    request.nextUrl.search
  ) {
    // Keep the search landing page indexed, but not every filter combination.
    response.headers.set('X-Robots-Tag', 'noindex, follow')
  }

  return response
}

export const config = {
  matcher: ['/((?!_next|api|.*\\..*).*)'],
}
