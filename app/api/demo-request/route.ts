import { NextRequest, NextResponse } from "next/server";
import { createDemoRequest } from "@/lib/services/admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      phone,
      restaurantName,
      address,
      demoDate,
      demoSlot,
      referralSource,
      notes,
    } = body;

    // Validate required fields
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Please enter your full name." }, { status: 400 });
    }
    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    if (!phone || typeof phone !== "string" || phone.trim().length < 7) {
      return NextResponse.json({ error: "Please enter a valid phone or WhatsApp number." }, { status: 400 });
    }
    if (!restaurantName || typeof restaurantName !== "string" || !restaurantName.trim()) {
      return NextResponse.json({ error: "Please enter your restaurant or cafe name." }, { status: 400 });
    }
    if (!address || typeof address !== "string" || !address.trim()) {
      return NextResponse.json({ error: "Please enter your restaurant location or address." }, { status: 400 });
    }
    if (!demoDate || typeof demoDate !== "string" || !demoDate.trim()) {
      return NextResponse.json({ error: "Please select a date for the demo." }, { status: 400 });
    }
    if (!demoSlot || typeof demoSlot !== "string" || !demoSlot.trim()) {
      return NextResponse.json({ error: "Please choose a 1-hour time slot between 10:00 AM and 10:00 PM." }, { status: 400 });
    }

    const created = await createDemoRequest({
      name,
      email,
      phone,
      restaurantName,
      address,
      demoDate,
      demoSlot,
      referralSource: typeof referralSource === "string" ? referralSource.trim() : undefined,
      notes,
    });

    return NextResponse.json({
      success: true,
      message: "Your demo request has been booked successfully! Our team will contact you shortly.",
      demo: created,
    });
  } catch (error: any) {
    console.error("POST /api/demo-request error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit demo request. Please try again." },
      { status: 500 }
    );
  }
}
