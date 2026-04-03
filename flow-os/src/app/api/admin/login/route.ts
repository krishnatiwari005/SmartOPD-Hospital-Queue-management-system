import { NextRequest, NextResponse } from "next/server";

const ADMIN_ID = "admin@hospital.com";
const ADMIN_PASSWORD = "Atarsingh001";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (username === ADMIN_ID && password === ADMIN_PASSWORD) {
      const res = NextResponse.json({ success: true });
      // Set a simple session cookie (httpOnly, secure in prod)
      res.cookies.set("smartopd_admin", "authenticated", {
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 8, // 8 hours
        sameSite: "lax",
      });
      return res;
    }

    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
