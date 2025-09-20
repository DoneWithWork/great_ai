import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from 'next/server';

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/roster(.*)',
  '/requests(.*)',
  '/admin(.*)',
  '/nurse(.*)', // explicitly protect nurse routes too
]);

const isAdminRoute = createRouteMatcher([
  '/admin(.*)',
]);

const isNurseRoute = createRouteMatcher([
  '/nurse(.*)',
]);

type SessionClaims = {
  publicMetadata?: {
    role?: string;
    [key: string]: any;
  };
  [key: string]: any;
};

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    const { sessionClaims } = await auth() as { sessionClaims: SessionClaims };

    const role = sessionClaims?.publicMetadata?.role;

    if (isAdminRoute(req)) {
      if (role !== 'admin') {
        return NextResponse.redirect(new URL('/', req.url));
      }
    }

    if (isNurseRoute(req)) {
      if (role !== 'nurse' && role !== 'admin') {
        return NextResponse.redirect(new URL('/', req.url));
      }
    }
  }
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
