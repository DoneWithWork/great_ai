import { useSession } from '@clerk/nextjs';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation';
import { NextRequest, NextResponse } from 'next/server'

const isOnboardingRoute = createRouteMatcher(['/onboarding'])
const isPublicRoute = createRouteMatcher(['/', '/onboarding'])

type PublicMetadata = {
  onboardingComplete?: boolean;
};

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { isAuthenticated, sessionClaims, redirectToSignIn } = await auth()
  // If not signed in and route is private → send to sign in
  if (!isAuthenticated && !isPublicRoute(req)) {
    return redirectToSignIn({ returnBackUrl: req.url })
  }
  if (!sessionClaims?.metadata.onboardingComplete) {
    redirect("/onboarding")
  }


  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
