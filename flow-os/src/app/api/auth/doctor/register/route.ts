import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, department, room } = await req.json();

    if (!name || !email || !password || !department || !room) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (!email.toLowerCase().endsWith("@hospital.com")) {
      return NextResponse.json({ error: "Only official @hospital.com emails are allowed" }, { status: 403 });
    }

    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    const doctorId = `doc-${slug}-${Math.floor(Math.random() * 1000)}`;

    const { data: doctor, error: insertError } = await supabaseAdmin
      .from("doctors")
      .insert({
        id: doctorId,
        name,
        email: email.toLowerCase(),
        password,
        department,
        room,
        avg_consultation_time_ms: 600000,
        patients_seen_today: 0,
        total_tokens_generated: 0,
        is_active: true
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        return NextResponse.json({ error: "Email already registered" }, { status: 400 });
      }
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    const res = NextResponse.json({ 
      success: true, 
      id: doctor.id,
      message: "Doctor registered successfully"
    });
    
    res.cookies.set("smartopd_doctor_id", doctor.id, {
      httpOnly: false, // Required for the client-side console to verify authorization
      path: "/",
      maxAge: 60 * 60 * 12,
      sameSite: "lax",
    });

    return res;
  } catch (err) {
    console.error("Registration Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
