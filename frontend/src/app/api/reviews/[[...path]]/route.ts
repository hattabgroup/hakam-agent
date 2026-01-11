import { NextRequest, NextResponse } from "next/server";

async function proxy(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
    const token = request.cookies.get("hakam_session")?.value;
    const { path } = await params;

    if (!token) {
        return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    const subPath = path ? path.join("/") : "";
    const url = `${process.env.API_URL}/reviews/${subPath}`;

    try {
        const body = request.method !== "GET" && request.method !== "DELETE"
            ? await request.json()
            : undefined;

        const response = await fetch(url, {
            method: request.method,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: body ? JSON.stringify(body) : undefined,
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error(`Error proxying to ${url}:`, error);
        return NextResponse.json({ detail: "Internal Server Error" }, { status: 500 });
    }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const DELETE = proxy;
