import { NextResponse } from "next/server";
import { getHospitalInsights } from "@/lib/services";

export async function GET() {
  try {
    const insights = await getHospitalInsights();
    return NextResponse.json({ success: true, insights });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
