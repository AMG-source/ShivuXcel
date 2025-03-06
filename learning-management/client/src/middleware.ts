import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/clerk-sdk-node";  // ✅ Correct Clerk SDK Import

const isStudentRoute = createRouteMatcher(["/user/(.*)"]);
const isTeacherRoute = createRouteMatcher(["/teacher/(.*)"]);

export default clerkMiddleware(async (authFn, req) => {
  const auth = await authFn(); // Ensure authentication is awaited
  const { userId } = auth;

  let userRole: string = "student"; // Default to "student" role

  if (userId) {
    try {
      // 🔹 Fetch user metadata from Clerk API
      const user = await clerkClient.users.getUser(userId);
      
      // Ensure correct typing for metadata
      const metadata = user.publicMetadata as { userType?: string };
      userRole = metadata?.userType || "student";

      console.log("🔹 Clerk user metadata:", metadata); // Debugging

    } catch (error) {
      console.error("❌ Error fetching Clerk user metadata:", error);
    }
  }

  console.log("🔹 Extracted userRole from Clerk:", userRole); // Debugging

  // 🔄 Redirect logic based on user role
  if (isStudentRoute(req) && userRole !== "student") {
    return NextResponse.redirect(new URL("/teacher/courses", req.url));
  }

  if (isTeacherRoute(req) && userRole !== "teacher") {
    return NextResponse.redirect(new URL("/user/courses", req.url));
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
