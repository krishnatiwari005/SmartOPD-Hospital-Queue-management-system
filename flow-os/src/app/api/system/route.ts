import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data: doctors, error: docError } = await supabase
      .from("doctors")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (docError) {
      return NextResponse.json({ error: docError.message }, { status: 500 });
    }

    // Transform to match the expected UI structure if needed 
    // In db.ts it returned queue length, here we might need to count it or just return the doctor objects
    // The ReceptionDashboard expects an array of doctors with a .id, .name, .department, and .queueLength
    
    // Fetch queue counts for each doctor
    const doctorsWithQueue = await Promise.all(doctors.map(async (doc) => {
        const { count } = await supabase
            .from("patients")
            .select("*", { count: "exact", head: true })
            .eq("doctor_id", doc.id)
            .eq("status", "WAITING");
        
        return {
            ...doc,
            averageConsultationTimeMs: doc.avg_consultation_time_ms,
            queueLength: count || 0
        };
    }));

    return NextResponse.json({
      success: true,
      doctors: doctorsWithQueue
    });
  } catch (err) {
    console.error("System API Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
