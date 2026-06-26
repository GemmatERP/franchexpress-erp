import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Read cookies for auth state and role
  const token = request.cookies.get('fe_token')?.value;
  const role = request.cookies.get('fe_role')?.value;

  // Protect /dashboard routes
  if (pathname.startsWith('/dashboard')) {
    if (!token) {
      // Not logged in -> redirect to login
      const url = new URL('/login', request.url);
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    // Role-based protection:
    // Delivery role is ONLY allowed to access /dashboard/delivery
    if (role === 'delivery') {
      if (!pathname.startsWith('/dashboard/delivery')) {
        return NextResponse.redirect(new URL('/dashboard/delivery', request.url));
      }
    } else {
      // Admins and Super Admins can access /dashboard/delivery; Employees and others cannot
      if (pathname.startsWith('/dashboard/delivery') && role !== 'admin' && role !== 'super_admin') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
  }

  // Redirect logged-in users away from /login
  if (pathname === '/login' && token) {
    if (role === 'delivery') {
      return NextResponse.redirect(new URL('/dashboard/delivery', request.url));
    }
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
};
