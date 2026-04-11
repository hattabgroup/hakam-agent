import { NextResponse } from "next/server";
import axios from "axios";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get("token");
        
        if (!token) {
            return NextResponse.json({ detail: "Token is required" }, { status: 400 });
        }

        const authServiceUrl = process.env.AUTH_SERVICE_URL || "http://auth-service:8000";

        const response = await axios.get(`${authServiceUrl}/auth/verify-reset-token?token=${token}`);

        return NextResponse.json(response.data);
    } catch (error: any) {
        const status = error.response?.status || 500;
        const detail = error.response?.data?.detail || "Failed to verify token";
        return NextResponse.json({ detail }, { status });
    }
}
