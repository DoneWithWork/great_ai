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



});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
