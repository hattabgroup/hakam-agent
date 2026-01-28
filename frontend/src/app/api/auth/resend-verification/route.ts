import { NextResponse } from "next/server";
import axios from "axios";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const authServiceUrl = process.env.AUTH_SERVICE_URL || "http://auth-service:8000";

        // Forward request to auth-service
        const response = await axios.post(`${authServiceUrl}/auth/resend-verification`, body);

        // Forward successful response
        return NextResponse.json(response.data);
    } catch (error: any) {
        const status = error.response?.status || 500;
        const detail = error.response?.data?.detail || "Failed to resend verification email";
        return NextResponse.json({ detail }, { status });
    }
}
