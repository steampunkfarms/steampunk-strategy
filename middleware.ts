import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes — bypass auth
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/webhooks') ||
    pathname.startsWith('/api/cron') ||
    pathname.startsWith('/api/costs') ||
    pathname.startsWith('/api/health') ||
    pathname.startsWith('/api/raiseright/stats') ||
    pathname.startsWith('/api/impact') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Internal service auth — routes that accept INTERNAL_SECRET for pipeline calls
  if (pathname.startsWith('/api/documents/parse')) {
    const authHeader = request.headers.get('authorization');
    const secret = process.env.INTERNAL_SECRET?.trim();
    if (secret && authHeader && authHeader === `Bearer ${secret}`) {
      return NextResponse.next();
    }
    // Fall through to session check for UI calls
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
