import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email.toLowerCase().endsWith("@hospital.com")) {
      return NextResponse.json({ error: "Only official @hospital.com emails are allowed" }, { status: 403 });
    }

    const { data: doc, error: docError } = await supabaseAdmin
      .from("doctors")
      .select("*")
      .eq("email", email.toLowerCase())
      .single();

    if (docError || !doc) {
      return NextResponse.json({ error: "Doctor account not found" }, { status: 404 });
    }

    if (doc.password !== password) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    await supabaseAdmin.from("doctors").update({ is_active: true }).eq("id", doc.id);

    const res = NextResponse.json({ 
      success: true, 
      id: doc.id,
      name: doc.name
    });
    
    res.cookies.set("smartopd_doctor_id", doc.id, {
      httpOnly: false, // Required for the client-side console to verify authorization
      path: "/",
      maxAge: 60 * 60 * 12,
      sameSite: "lax",
    });

    return res;
  } catch (err) {
    console.error("Doctor Login Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
