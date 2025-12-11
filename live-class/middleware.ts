import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  publicRoutes: [
    "/",
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/api/webhooks(.*)",
  ],
});

export const config = {
  matcher: [
    // Skip static files
    "/((?!_next|.*\\..*).*)",

    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
