import { supabaseAdmin } from "./supabase";

// ─── Daily Insights Engine ───────────────────────────────
// This service analyzes real patient throughput to provide
// 'Learned' insights for the AI Chatbot without external costs.

export interface HospitalInsights {
  avgWaitTimeMins: number;
  busiestDepartment: string;
  fastestDepartment: string;
  todayPatientsCount: number;
  efficiencyGain: number; // % comparison to historical average
}

let lastInsights: HospitalInsights | null = null;
let lastCalculatedAt = 0;
const INSIGHTS_TTL_MS = 15 * 60 * 1000; // Recalculate every 15 minutes

/**
 * Calculates current hospital throughput and efficiency levels.
 */
export async function calculateDailyInsights(): Promise<HospitalInsights | null> {
  const now = new Date();
  const todayStart = new Date(now.setHours(0, 0, 0, 0)).toISOString();

  try {
    // 1. Fetch completed patients today
    const { data: patients } = await supabaseAdmin
      .from("patients")
      .select("*, doctors(*)")
      .eq("status", "COMPLETED")
      .gte("created_at", todayStart);

    if (!patients || patients.length === 0) {
      return {
        avgWaitTimeMins: 0,
        busiestDepartment: "General OPD",
        fastestDepartment: "None yet",
        todayPatientsCount: 0,
        efficiencyGain: 0
      };
    }

    // 2. Group by department for throughput analysis
    const deptStats: Record<string, { count: number; totalDuration: number }> = {};
    let totalWaitMs = 0;

    patients.forEach((p) => {
      const dept = p.doctors?.department || "General";
      const duration = p.consultation_duration_ms || 600000; // Fallback 10m
      
      if (!deptStats[dept]) deptStats[dept] = { count: 0, totalDuration: 0 };
      deptStats[dept].count += 1;
      deptStats[dept].totalDuration += duration;
      totalWaitMs += duration;
    });

    // 3. Find busiest and fastest departments
    let busiest = "General OPD";
    let maxCount = 0;
    let fastest = "General OPD";
    let minAvg = Infinity;

    Object.entries(deptStats).forEach(([dept, stat]) => {
      if (stat.count > maxCount) {
        maxCount = stat.count;
        busiest = dept;
      }
      const avg = stat.totalDuration / stat.count;
      if (avg < minAvg) {
        minAvg = avg;
        fastest = dept;
      }
    });

    const insights: HospitalInsights = {
      avgWaitTimeMins: Math.round(totalWaitMs / patients.length / 60000),
      busiestDepartment: busiest,
      fastestDepartment: fastest,
      todayPatientsCount: patients.length,
      efficiencyGain: Math.round(((600000 - (totalWaitMs / patients.length)) / 600000) * 100) // vs theoretical 10m avg
    };

    lastInsights = insights;
    lastCalculatedAt = Date.now();
    
    console.log(`🧠 AI Insights Updated: ${insights.todayPatientsCount} patients, busiest: ${insights.busiestDepartment}`);
    return insights;
  } catch (err) {
    console.error("⚠️ Insights Engine Error:", err);
    return null;
  }
}

/**
 * Get the latest learned insights. Triggers recalculation if stale.
 */
export async function getLatestInsights(): Promise<HospitalInsights> {
  if (!lastInsights || Date.now() - lastCalculatedAt > INSIGHTS_TTL_MS) {
    const fresh = await calculateDailyInsights();
    if (fresh) return fresh;
  }
  return lastInsights || {
    avgWaitTimeMins: 10,
    busiestDepartment: "General OPD",
    fastestDepartment: "General OPD",
    todayPatientsCount: 0,
    efficiencyGain: 0
  };
}
