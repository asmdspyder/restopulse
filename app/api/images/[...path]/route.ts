import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/session";
import { getFromR2 } from "@/lib/r2/client";
import { Readable } from "stream";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const auth = await getAuthContext();
    if (!auth || !auth.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { path: pathSegments } = await params;
    if (!pathSegments || pathSegments.length === 0) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    const restaurantIdFromPath = pathSegments[0];

    // Authorization: User must be superadmin or belong to this restaurant
    if (auth.user.role !== "superadmin" && auth.restaurant?.id !== restaurantIdFromPath) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const storageKey = pathSegments.join("/");

    // 30-day retention check
    // Path format: {restaurantId}/checklists/{YYYY-MM-DD}/...
    const dateSegment = pathSegments.find((p) => /^\d{4}-\d{2}-\d{2}$/.test(p));
    if (dateSegment) {
      const recordDate = new Date(dateSegment);
      if (!isNaN(recordDate.getTime())) {
        const diffMs = Date.now() - recordDate.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays > 30) {
          // Return an SVG badge explaining that the photo retention period has expired
          const expiredSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400" fill="none">
            <rect width="600" height="400" fill="#F8FAFC" rx="12"/>
            <rect x="20" y="20" width="560" height="360" rx="8" stroke="#E2E8F0" stroke-width="2" stroke-dasharray="6 6"/>
            <circle cx="300" cy="160" r="44" fill="#FEE2E2"/>
            <path d="M300 140v25m0 15h.01" stroke="#EF4444" stroke-width="3.5" stroke-linecap="round"/>
            <text x="300" y="240" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="600" fill="#0F172A" text-anchor="middle">Photo Retention Expired</text>
            <text x="300" y="268" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="#64748B" text-anchor="middle">Checklist photos are automatically removed after 30 days.</text>
            <text x="300" y="292" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#94A3B8" text-anchor="middle">Captured on ${dateSegment}</text>
          </svg>`;
          return new NextResponse(expiredSvg, {
            status: 200,
            headers: {
              "Content-Type": "image/svg+xml",
              "Cache-Control": "public, max-age=86400",
            },
          });
        }
      }
    }

    const r2Response = await getFromR2(storageKey);

    if (!r2Response.Body) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // Convert AWS SDK Stream to web Response
    const stream = r2Response.Body as any;
    let buffer: Buffer;

    if (stream instanceof Readable) {
      const chunks: Uint8Array[] = [];
      for await (const chunk of stream) {
        chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
      }
      buffer = Buffer.concat(chunks);
    } else if (typeof stream.transformToByteArray === "function") {
      const bytes = await stream.transformToByteArray();
      buffer = Buffer.from(bytes);
    } else {
      const arrayBuffer = await (stream as any).arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    }

    const contentType = r2Response.ContentType || "image/webp";

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, immutable",
        "Content-Length": String(buffer.length),
      },
    });
  } catch (error: any) {
    if (error?.name === "NoSuchKey" || error?.$metadata?.httpStatusCode === 404) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }
    console.error("GET /api/images error:", error);
    return NextResponse.json({ error: "Failed to load image" }, { status: 500 });
  }
}
