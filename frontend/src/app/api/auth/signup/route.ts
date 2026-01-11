import { NextResponse } from "next/server";
import axios from "axios";

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();
        const authServiceUrl = process.env.AUTH_SERVICE_URL || "http://auth-service:8000";

        await axios.post(`${authServiceUrl}/auth/signup`, {
            email,
            password,
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        const status = error.response?.status || 500;
        const detail = error.response?.data?.detail || "Registration failed";
        return NextResponse.json({ detail }, { status });
    }
}
