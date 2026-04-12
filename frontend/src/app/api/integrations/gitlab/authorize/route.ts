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

        const response = await axios.get(`${apiServiceUrl}/integrations/gitlab/authorize`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        return NextResponse.json(response.data);
    } catch (error: any) {
        const status = error.response?.status || 500;
        const detail = error.response?.data?.detail || "Failed to get GitLab authorization URL";
        return NextResponse.json({ detail }, { status });
    }
}
