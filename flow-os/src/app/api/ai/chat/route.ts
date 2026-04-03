import { NextResponse } from "next/server";
import { identifyIntent } from "@/lib/chatbot-ml";
import { getPatientLiveStatus, getHospitalInsights } from "@/lib/services";

export async function POST(req: Request) {
  try {
    const { message, patientId } = await req.json();
    if (!message) return NextResponse.json({ success: false, error: "No message" });

    // 1. Identify Intent (Multilingual: English/Hindi)
    const intent = identifyIntent(message);
    const q = message.toLowerCase();

    // 2. Fetch context if needed
    let insights = null;
    try {
      insights = await getHospitalInsights();
    } catch (e) { /* ignore */ }

    // 3. Response Logic based on Intent
    let response = "";

    switch (intent) {
      case "GREETING":
        response = "Namaste! Hello! I'm your SmartOPD Assistant. I can help with token status, pharmacy location, or lab reports. How can I assist you today?";
        break;

      case "CHECK_STATUS":
        if (patientId) {
          const status = await getPatientLiveStatus(patientId);
          if (status) {
            response = `Aapka current token status: You are at position #${status.liveTracking.peopleAhead + 1} for ${status.doctor.name}. Turn aane me approx ${status.liveTracking.estimatedWaitMins} minutes lagenge.`;
          } else {
            response = "I couldn't find your live token right now. Please check if you are on the tracker page.";
          }
        } else {
          response = "I can check your wait time if you are on your live tracking page. Abhi system-wide average wait time " + (insights?.avgWaitTimeMins || 10) + " minutes hai.";
        }
        break;

      case "FIND_PHARMACY":
        response = "Pharmacy (Dawai ki dukan) Ground Floor par exit ke paas hai. Yeh 24/7 khula rehta hai.";
        break;

      case "FIND_ROOM":
        response = "Doctor cabins (Room) mostly 1st Floor par hain. Apna exact cabin number digital parcha par check karein.";
        break;

      case "LAB_REPORTS":
        response = "Pathology Lab 1st Floor (East Wing) par hai. Reports usually 4-6 ghante me mil jaati hain.";
        break;

      case "NAV_FACILITIES":
        response = "Toilets aur peene ka paani (Drinking water) har floor ke end me available hai. Lifts center area me hain.";
        break;

      case "TRIAGE_LOGIC":
        response = "Humara AI system symptoms ke basis par patients ko prioritize karta hai. Critical cases ko jaldi dekha jata hai taaki sab safe rahein. Isliye kabhi line thoda fast ya slow move karti hai.";
        break;

      case "SKIP_POLICY":
        response = "Agar aap call karne par waha nahi hote, toh token skip ho jata hai. Ghabraiye mat, aapka token queue ke end me move ho gaya hai. Agle cycle me aapka turn fir aayega.";
        break;

      case "EMERGENCY":
        response = "🔴 EMERGENCY: Agar bohot zyada dard hai ya saans lene me takleef hai, toh please wait na karein. Staff ko turant bataein ya Ground Floor par Emergency Wing jayein!";
        break;

      case "SYSTEM_INFO":
        response = "Main SmartOPD Assistant hoon. Mera kaam hai aapko hospital me token, direction, aur reports me help karna.";
        break;

      case "THANKS":
        response = "Dhanyawad! Welcome! Khush rahiye aur healthy rahiye.";
        break;

      default:
        response = "I'm sorry, I didn't quite understand. Aap pharmacy, wait time, ya lab reports ke baare me pooch sakte hain.";
    }

    return NextResponse.json({ success: true, response, intent });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
