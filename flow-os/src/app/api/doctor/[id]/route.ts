import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // 1. Fetch doctor from Supabase using admin client
    const { data: doc, error: docError } = await supabaseAdmin
      .from("doctors")
      .select("*")
      .eq("id", id)
      .single();

    if (docError || !doc) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    // 2. Fetch queue details (WAITING patients)
    const { data: queueDetails } = await supabaseAdmin
      .from("patients")
      .select("*")
      .eq("doctor_id", id)
      .eq("status", "WAITING")
      .order("created_at", { ascending: true });

    // 3. Fetch in-cabin patient
    let inCabin = null;
    if (doc.current_patient_id) {
      const { data: p } = await supabaseAdmin
        .from("patients")
        .select("*")
        .eq("id", doc.current_patient_id)
        .single();
      inCabin = p;
    }

    const mapPatient = (p: any) => p ? ({ ...p, tokenId: p.token_id }) : null;
    const mappedQueue = (queueDetails || []).map(mapPatient);
    const mappedInCabin = mapPatient(inCabin);

    return NextResponse.json({
      success: true,
      doctor: {
        ...doc,
        averageConsultationTimeMs: doc.avg_consultation_time_ms // Mapping for UI
      },
      inCabin: mappedInCabin,
      upNext: mappedQueue[0] || null,
      queueDetails: mappedQueue
    });
  } catch (err) {
    console.error("Doctor API Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
