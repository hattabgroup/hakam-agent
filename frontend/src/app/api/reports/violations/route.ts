import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const token = request.cookies.get("hakam_session")?.value;

    if (!token) {
        return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;

    try {
        const response = await fetch(`${process.env.API_URL}/reports/violations?${searchParams.toString()}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error("Error fetching violations:", error);
        return NextResponse.json({ detail: "Internal Server Error" }, { status: 500 });
    }
}
