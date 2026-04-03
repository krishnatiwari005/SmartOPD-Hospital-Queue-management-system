import natural from "natural";
import trainingData from "./ml-data.json";
import { supabaseAdmin } from "./supabase";

// ─── Self-Learning NLP Triage Engine ───────────────────────────────
// This classifier trains on:
//   1. Base dataset (ml-data.json) — cold start knowledge
//   2. Real patient records from Supabase — learns from doctor feedback
// It auto-retrains periodically so the model improves over time.

let classifier = new natural.BayesClassifier();
let lastTrainedAt = 0;
let feedbackCount = 0;
const RETRAIN_INTERVAL_MS = 15 * 60 * 1000; // Auto-retrain every 15 minutes

// ─── Step 1: Train from base dataset (always available, synchronous) ───
function trainFromBaseData(c: InstanceType<typeof natural.BayesClassifier>) {
  Object.entries(trainingData).forEach(([level, symptomsArray]) => {
    (symptomsArray as string[]).forEach((symptoms: string) => {
      c.addDocument(symptoms, level);
    });
  });
}

// ─── Step 2: Train from real completed patient data in Supabase ───
async function trainFromFeedback(c: InstanceType<typeof natural.BayesClassifier>): Promise<number> {
  try {
    const { data: completedPatients } = await supabaseAdmin
      .from("patients")
      .select("symptoms, triage_level")
      .eq("status", "COMPLETED")
      .not("symptoms", "is", null)
      .not("triage_level", "is", null);

    if (completedPatients && completedPatients.length > 0) {
      let count = 0;
      completedPatients.forEach((p: { symptoms: string | null; triage_level: string | null }) => {
        if (p.symptoms && p.symptoms.trim().length > 0 && p.triage_level) {
          c.addDocument(p.symptoms, p.triage_level);
          count++;
        }
      });
      return count;
    }
  } catch (err) {
    console.error("⚠️ ML Feedback Training Error:", err);
  }
  return 0;
}

// ─── Initial cold start (synchronous, base data only) ───
console.log("🧠 SmartOPD ML Engine: Cold start — training on base dataset...");
trainFromBaseData(classifier);
classifier.train();
lastTrainedAt = Date.now();
console.log("✅ SmartOPD ML Engine: Base training complete (44 samples)");

// ─── Async retrain: base data + real patient feedback ───
async function retrain() {
  try {
    const newClassifier = new natural.BayesClassifier();
    trainFromBaseData(newClassifier);
    const realDataCount = await trainFromFeedback(newClassifier);
    newClassifier.train();

    // Atomic swap — replace the old classifier with the new one
    classifier = newClassifier;
    feedbackCount = realDataCount;
    lastTrainedAt = Date.now();

    const totalSamples = 44 + realDataCount;
    console.log(`🔄 ML Engine: Self-update complete | ${totalSamples} total samples (${realDataCount} from real patients) | ${new Date().toLocaleTimeString()}`);
  } catch (err) {
    console.error("⚠️ ML Retrain Error:", err);
  }
}

// Kick off first async retrain to incorporate any existing patient data
retrain();

// ─── Public API ────────────────────────────────────────────────────

export type TriageLevel = "CRITICAL" | "URGENT" | "STANDARD";

/**
 * Predicts triage severity from symptom text using the self-learning NLP model.
 * Auto-triggers retraining if the model is stale (>15 min since last train).
 */
export function predictTriageLevel(symptoms: string): TriageLevel {
  // Check if model is stale and needs retraining
  if (Date.now() - lastTrainedAt > RETRAIN_INTERVAL_MS) {
    retrain(); // Fire-and-forget; current request uses current model
  }

  if (!symptoms || symptoms.trim().length === 0) {
    return "STANDARD";
  }

  const prediction = classifier.classify(symptoms);

  if (["CRITICAL", "URGENT", "STANDARD"].includes(prediction)) {
    return prediction as TriageLevel;
  }

  return "STANDARD";
}

/**
 * Force an immediate retrain. Call after doctor provides triage correction.
 */
export async function retrainModel(): Promise<{ totalSamples: number; feedbackSamples: number }> {
  await retrain();
  return { totalSamples: 44 + feedbackCount, feedbackSamples: feedbackCount };
}

/**
 * Get current model stats.
 */
export function getModelStats() {
  return {
    lastTrainedAt: new Date(lastTrainedAt).toISOString(),
    baseSamples: 44,
    feedbackSamples: feedbackCount,
    totalSamples: 44 + feedbackCount,
    retrainIntervalMins: RETRAIN_INTERVAL_MS / 60000,
  };
}

// ─── ML Consultation Time Prediction ───────────────────────────────
// Predicts how long each patient's consultation will take based on
// their triage level and historical data from completed patients.
// This replaces the simple "global avg × count" wait time formula
// with a per-patient, per-triage-level ML prediction.

interface TimeCacheEntry {
  averages: Record<string, number>;
  sampleCounts: Record<string, number>;
  cachedAt: number;
}

const timePredictionCache = new Map<string, TimeCacheEntry>();
const TIME_CACHE_TTL_MS = 5 * 60 * 1000; // 5-minute cache

// Medical consultation time multipliers (used as fallback/cold start)
// Learned from general OPD patterns: critical cases take ~1.5x longer
const TRIAGE_TIME_MULTIPLIERS: Record<string, number> = {
  CRITICAL: 1.5,
  URGENT: 1.2,
  STANDARD: 0.85,
};

/**
 * ML-predicted consultation duration for a patient based on triage level.
 * Uses real completed patient data per doctor when available (≥3 samples).
 * Falls back to doctor's global average × triage multiplier.
 *
 * @returns Predicted consultation time in milliseconds
 */
export async function predictConsultationTime(
  doctorId: string,
  triageLevel: string,
  doctorGlobalAvgMs: number
): Promise<number> {
  const level = triageLevel || "STANDARD";

  // Check cache first
  const cached = timePredictionCache.get(doctorId);
  if (cached && Date.now() - cached.cachedAt < TIME_CACHE_TTL_MS) {
    if (cached.averages[level] !== undefined) {
      return cached.averages[level];
    }
    // Level not in cache but cache is fresh → use multiplier fallback
    const multiplier = TRIAGE_TIME_MULTIPLIERS[level] || 1;
    return Math.round(doctorGlobalAvgMs * multiplier);
  }

  // Query real consultation durations from completed patients
  try {
    const { data: completedPatients } = await supabaseAdmin
      .from("patients")
      .select("triage_level, consultation_duration_ms")
      .eq("doctor_id", doctorId)
      .eq("status", "COMPLETED")
      .not("consultation_duration_ms", "is", null)
      .not("triage_level", "is", null);

    if (completedPatients && completedPatients.length >= 3) {
      // Group by triage level and compute per-level averages
      const groups: Record<string, number[]> = {};
      completedPatients.forEach((p: { triage_level: string | null; consultation_duration_ms: number | null }) => {
        if (p.triage_level && p.consultation_duration_ms && p.consultation_duration_ms > 0) {
          if (!groups[p.triage_level]) groups[p.triage_level] = [];
          groups[p.triage_level].push(p.consultation_duration_ms);
        }
      });

      const averages: Record<string, number> = {};
      const sampleCounts: Record<string, number> = {};
      Object.entries(groups).forEach(([lvl, durations]) => {
        averages[lvl] = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
        sampleCounts[lvl] = durations.length;
      });

      // Cache results
      timePredictionCache.set(doctorId, { averages, sampleCounts, cachedAt: Date.now() });

      if (averages[level] !== undefined) {
        console.log(`🧠 ML Time Prediction: ${level} → ${Math.round(averages[level] / 60000)}m (from ${sampleCounts[level]} samples)`);
        return averages[level];
      }
    }
  } catch {
    // consultation_duration_ms column may not exist yet — fall back gracefully
  }

  // Fallback: doctor's global average × triage-based multiplier
  const multiplier = TRIAGE_TIME_MULTIPLIERS[level] || 1;
  return Math.round(doctorGlobalAvgMs * multiplier);
}
