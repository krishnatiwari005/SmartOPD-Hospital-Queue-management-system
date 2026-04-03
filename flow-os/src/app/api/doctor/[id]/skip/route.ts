import { NextRequest, NextResponse } from "next/server";
import { skipCurrentPatient } from "@/lib/services";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await skipCurrentPatient(id);

    if (!result || !result.success) {
      return NextResponse.json({ error: result?.error || "Error skipping patient" }, { status: 400 });
    }

    // Return current state for the UI using admin client
    const { data: doc } = await supabaseAdmin.from("doctors").select("*").eq("id", id).single();
    const { data: queueDetails } = await supabaseAdmin.from("patients").select("*").eq("doctor_id", id).eq("status", "WAITING").order("created_at", { ascending: true });
    
    let inCabin = null;
    if (doc?.current_patient_id) {
        const { data: p } = await supabaseAdmin.from("patients").select("*").eq("id", doc.current_patient_id).single();
        inCabin = p;
    }

    const mapPatient = (p: any) => p ? ({ ...p, tokenId: p.token_id }) : null;
    const mappedQueue = (queueDetails || []).map(mapPatient);

    return NextResponse.json({
      success: true,
      doctor: {
        ...doc,
        averageConsultationTimeMs: doc?.avg_consultation_time_ms
      },
      inCabin: mapPatient(inCabin),
      upNext: mappedQueue[0] || null,
      queueDetails: mappedQueue
    });
  } catch (err) {
    console.error("Skip Patient API Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
