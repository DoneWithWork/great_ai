import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

interface PublicMetadata {
  onboardingComplete?: boolean;
  role?: string;
}

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)?",
  "/sign-up(.*)?",
]);

export default clerkMiddleware(async (auth, req) => {
  const { isAuthenticated, sessionClaims, redirectToSignIn } = await auth();

  // If not signed in and route is private → send to sign in
  if (!isAuthenticated && !isPublicRoute(req)) {
    return redirectToSignIn({ returnBackUrl: req.url });
  }

  // If signed in but no onboarding complete → send to onboarding
  if (
    isAuthenticated &&
    !(sessionClaims?.publicMetadata as PublicMetadata)?.onboardingComplete &&
    !req.url.includes("/onboarding") &&
    !isPublicRoute(req)
  ) {
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }

  // Role-based redirects after onboarding
  if (
    isAuthenticated &&
    (sessionClaims?.publicMetadata as PublicMetadata)?.onboardingComplete
  ) {
    const role = (sessionClaims?.publicMetadata as PublicMetadata)?.role;

    // If on root path, redirect to appropriate dashboard
    if (req.nextUrl.pathname === "/") {
      if (role === "admin") {
        return NextResponse.redirect(new URL("/admin/dashboard", req.url));
      } else {
        return NextResponse.redirect(new URL("/nurse/dashboard", req.url));
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
