import { NextResponse } from "next/server";
import axios from "axios";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
        return NextResponse.json({ detail: "Missing token" }, { status: 400 });
    }

    try {
        const authServiceUrl = process.env.AUTH_SERVICE_URL || "http://auth-service:8000";
        // Forward request to auth-service
        const response = await axios.get(`${authServiceUrl}/auth/verify?token=${token}`);
        return NextResponse.json(response.data);
    } catch (error: any) {
        const status = error.response?.status || 500;
        const detail = error.response?.data?.detail || "Verification failed";
        return NextResponse.json({ detail }, { status });
    }
}
