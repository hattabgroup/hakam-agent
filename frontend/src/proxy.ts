import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
    const token = request.cookies.get("hakam_session")?.value;
    const { pathname } = request.nextUrl;

    // Protected routes
    const protectedRoutes = ["/dashboard", "/integrations", "/repositories", "/reviews", "/policies"];

    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

    if (isProtectedRoute && !token) {
        const url = new URL("/login", request.url);
        url.searchParams.set("from", pathname);
        return NextResponse.redirect(url);
    }

    // If user is already logged in, redirect them away from auth pages and homepage
    const authRoutes = ["/login", "/signup", "/"];
    if (authRoutes.includes(pathname) && token) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/",
        "/dashboard/:path*",
        "/integrations/:path*",
        "/repositories/:path*",
        "/reviews/:path*",
        "/policies/:path*",
        "/login",
        "/signup"
    ],
};
