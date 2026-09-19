import { NextResponse } from "next/server";
import axios from "axios";
import { cookies } from "next/headers";

export async function POST(request: Request) {
    try {
        const { email, password, recaptcha_token } = await request.json();
        const authServiceUrl = process.env.AUTH_SERVICE_URL || "http://auth-service:8000";

        const response = await axios.post(`${authServiceUrl}/auth/signup`, {
            email,
            password,
            recaptcha_token,
        });

        const { access_token, requires_verification } = response.data;

        // Set session cookie immediately if auto-verified
        if (access_token) {
            const cookieStore = await cookies();
            cookieStore.set("hakam_session", access_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/",
                maxAge: 60 * 60 * 24 * 7, // 1 week
            });
        }

        return NextResponse.json({ 
            success: true,
            requires_verification: requires_verification ?? false
        });
    } catch (error: any) {
        const status = error.response?.status || 500;
        const detail = error.response?.data?.detail || "Registration failed";
        return NextResponse.json({ detail }, { status });
    }
}
