import { NextResponse } from "next/server";
import { addPatient } from "@/lib/services";

export async function POST(req: Request) {
  try {
    const { doctorId, name, phone } = await req.json();

    if (!doctorId || !name || !phone) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { success, patient, error } = await addPatient(doctorId, name, phone);
    
    if (!success || !patient) {
      return NextResponse.json({ error: error || "Invalid doctor selected" }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      patientId: patient.id,
      tokenId: patient.token_id,
      message: "Parcha generated successfully"
    });
  } catch (err: any) {
    console.error("Reception API Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
