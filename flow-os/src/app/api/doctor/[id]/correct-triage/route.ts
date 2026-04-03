import { NextRequest, NextResponse } from "next/server";
import { correctTriageLevel } from "@/lib/services";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { patientId, triageLevel } = await req.json();

    if (!patientId || !triageLevel) {
      return NextResponse.json({ error: "Missing patientId or triageLevel" }, { status: 400 });
    }

    const result = await correctTriageLevel(patientId, triageLevel);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Correct Triage API Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
