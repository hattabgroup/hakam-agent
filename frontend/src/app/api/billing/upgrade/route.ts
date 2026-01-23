import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const token = request.cookies.get("hakam_session")?.value;

    if (!token) {
        return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const response = await fetch(`${process.env.API_URL}/billing/upgrade`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error("Error upgrading subscription:", error);
        return NextResponse.json({ detail: "Internal Server Error" }, { status: 500 });
    }
}
