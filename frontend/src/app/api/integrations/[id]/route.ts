import { NextResponse } from "next/server";
import axios from "axios";
import { cookies } from "next/headers";

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("hakam_session")?.value;

        if (!token) {
            return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
        }

        const { id } = await params;
        const apiServiceUrl = process.env.API_URL || "http://api-service:8000";

        const response = await axios.delete(`${apiServiceUrl}/integrations/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        return NextResponse.json(response.data);
    } catch (error: any) {
        const status = error.response?.status || 500;
        const detail = error.response?.data?.detail || "Failed to delete integration";
        return NextResponse.json({ detail }, { status });
    }
}
