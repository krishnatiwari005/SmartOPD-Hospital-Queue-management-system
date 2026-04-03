import { NextRequest, NextResponse } from "next/server";
import { getPatientLiveStatus } from "@/lib/services";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const liveStatus = await getPatientLiveStatus(id);

    if (!liveStatus) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: liveStatus
    });
  } catch (err) {
    console.error("Patient Live Status API Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
