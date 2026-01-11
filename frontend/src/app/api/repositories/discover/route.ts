import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const token = request.cookies.get("hakam_session")?.value;
    const { searchParams } = new URL(request.url);
    const integrationId = searchParams.get("integration_id");

    if (!token) {
        return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    if (!integrationId) {
        return NextResponse.json({ detail: "integration_id is required" }, { status: 400 });
    }

    try {
        const response = await fetch(`${process.env.API_URL}/repositories/discover?integration_id=${integrationId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error("Error discovering repositories:", error);
        return NextResponse.json({ detail: "Internal Server Error" }, { status: 500 });
    }
}
