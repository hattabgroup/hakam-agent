import { NextResponse } from "next/server";
import axios from "axios";
import { cookies } from "next/headers";

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("hakam_session")?.value;

        if (!token) {
            return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
        }

        const apiServiceUrl = process.env.API_URL || "http://api-service:8000";

        const response = await axios.get(`${apiServiceUrl}/integrations/`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        return NextResponse.json(response.data);
    } catch (error: any) {
        const status = error.response?.status || 500;
        const detail = error.response?.data?.detail || "Failed to fetch integrations";
        return NextResponse.json({ detail }, { status });
    }
}

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("hakam_session")?.value;

        if (!token) {
            return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
        }

        const body = await request.json();
        const apiServiceUrl = process.env.API_URL || "http://api-service:8000";

        const response = await axios.post(`${apiServiceUrl}/integrations/`, body, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        return NextResponse.json(response.data);
    } catch (error: any) {
        const status = error.response?.status || 500;
        const detail = error.response?.data?.detail || "Failed to create integration";
        return NextResponse.json({ detail }, { status });
    }
}
