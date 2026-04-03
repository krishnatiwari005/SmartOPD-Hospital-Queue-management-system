// src/lib/services.ts
// SmartOPD: Production-Ready Queue Engine (Powered by Supabase)

import { supabaseAdmin } from "./supabase";

export type PatientStatus = "WAITING" | "IN_CABIN" | "COMPLETED" | "SKIPPED";

export interface Patient {
  id: string;
  token_id: string;
  name: string;
  phone: string;
  doctor_id: string;
  status: PatientStatus;
  created_at: string;
  cabin_entry_time?: string;
  symptoms?: string;
  triage_level?: string;
}

export interface Doctor {
  id: string;
  name: string;
  email: string;
  password?: string;
  department: string;
  room: string;
  avg_consultation_time_ms: number;
  patients_seen_today: number;
  total_tokens_generated: number;
  current_patient_id?: string;
}

/**
 * 🏥 RECEPTION SERVICES
 */

export async function addPatient(doctorId: string, name: string, phone: string, symptoms?: string, triageLevel?: string) {
  // 1. Get doctor data to generate token
  const { data: doc, error: docError } = await supabaseAdmin
    .from("doctors")
    .select("*")
    .eq("id", doctorId)
    .single();

  if (docError || !doc) return { success: false, error: "Doctor not found" };

  // 2. Increment token counter
  const newTokenNum = (doc.total_tokens_generated || 0) + 1;
  const prefix = doc.department.substring(0, 3).toUpperCase();
  const tokenId = `${prefix}-${newTokenNum.toString().padStart(3, "0")}`;

  // 3. Insert patient
  const { data: patient, error: insertError } = await supabaseAdmin
    .from("patients")
    .insert({
      token_id: tokenId,
      name,
      phone,
      doctor_id: doctorId,
      status: "WAITING",
      symptoms,
      triage_level: triageLevel || "STANDARD"
    })
    .select()
    .single();

  if (insertError) return { success: false, error: insertError.message };

  // 4. Update doctor's token count
  await supabaseAdmin
    .from("doctors")
    .update({ total_tokens_generated: newTokenNum })
    .eq("id", doctorId);

  return { 
    success: true, 
    patient: {
      ...patient,
      tokenId: patient.token_id
    } 
  };
}

/**
 * 👨‍⚕️ DOCTOR SERVICES
 */

export async function callNext(doctorId: string) {
  const now = new Date().toISOString();

  // 1. Fetch current context
  const { data: doc } = await supabaseAdmin
    .from("doctors")
    .select("*")
    .eq("id", doctorId)
    .single();

  if (!doc) return { success: false, error: "Doctor not found" };

  // 2. Complete the current patient (if any) and update EMA logic
  if (doc.current_patient_id) {
    const { data: currentPatient } = await supabaseAdmin
      .from("patients")
      .select("*")
      .eq("id", doc.current_patient_id)
      .single();

    if (currentPatient && currentPatient.status === "IN_CABIN") {
      // Mark as COMPLETED
      await supabaseAdmin
        .from("patients")
        .update({ status: "COMPLETED" })
        .eq("id", doc.current_patient_id);

      // 🧠 ML Learning: Update moving average
      if (currentPatient.cabin_entry_time) {
        const startTime = new Date(currentPatient.cabin_entry_time).getTime();
        const endTime = new Date(now).getTime();
        const timeSpentMs = endTime - startTime;
        
        // Basic EMA logic (clamped between 1m and 30m)
        const effectiveTimeMs = Math.min(Math.max(timeSpentMs, 60000), 1800000);
        const newAvg = Math.round(
          ((doc.avg_consultation_time_ms || 600000) * doc.patients_seen_today + effectiveTimeMs) /
          (doc.patients_seen_today + 1)
        );

        await supabaseAdmin
          .from("doctors")
          .update({ 
            avg_consultation_time_ms: newAvg,
            patients_seen_today: doc.patients_seen_today + 1
          })
          .eq("id", doctorId);

        // 🧠 Store actual consultation duration for ML time prediction learning
        try {
          await supabaseAdmin
            .from("patients")
            .update({ consultation_duration_ms: effectiveTimeMs })
            .eq("id", doc.current_patient_id);
        } catch { /* consultation_duration_ms column may not exist yet */ }
      }
    }
  }

  // 3. Pick the next patient in queue based on ML Priority
  const { data: waitingPatients } = await supabaseAdmin
    .from("patients")
    .select("*")
    .eq("doctor_id", doctorId)
    .eq("status", "WAITING");

  let nextPatient = null;
  if (waitingPatients && waitingPatients.length > 0) {
    const triageWeight: Record<string, number> = { CRITICAL: 0, URGENT: 1, STANDARD: 2 };
    waitingPatients.sort((a, b) => {
      const weightA = triageWeight[a.triage_level || "STANDARD"] ?? 2;
      const weightB = triageWeight[b.triage_level || "STANDARD"] ?? 2;
      if (weightA !== weightB) return weightA - weightB;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
    nextPatient = waitingPatients[0];
  }

  if (nextPatient) {
    // Bring them into the cabin
    await supabaseAdmin
      .from("patients")
      .update({ 
        status: "IN_CABIN",
        cabin_entry_time: now
      })
      .eq("id", nextPatient.id);

    await supabaseAdmin
      .from("doctors")
      .update({ current_patient_id: nextPatient.id })
      .eq("id", doctorId);

    return { 
      success: true, 
      nextPatient: {
        ...nextPatient,
        tokenId: nextPatient.token_id
      } 
    };
  }

  // No one left in queue
  await supabaseAdmin
    .from("doctors")
    .update({ current_patient_id: null })
    .eq("id", doctorId);

  return { success: true, message: "Queue is empty" };
}

export async function skipCurrentPatient(doctorId: string) {
  const { data: doc } = await supabaseAdmin
    .from("doctors")
    .select("*")
    .eq("id", doctorId)
    .single();

  if (doc?.current_patient_id) {
    // Move skipped patient back to WAITING with updated timestamp → goes to end of queue
    await supabaseAdmin
      .from("patients")
      .update({ 
        status: "WAITING",
        created_at: new Date().toISOString(),
        cabin_entry_time: null
      })
      .eq("id", doc.current_patient_id);

    // Clear doctor's current patient so callNext picks the next in line cleanly
    await supabaseAdmin
      .from("doctors")
      .update({ current_patient_id: null })
      .eq("id", doctorId);
  }

  return callNext(doctorId);
}

/**
 * 🧠 DOCTOR TRIAGE CORRECTION (ML Feedback Loop)
 */

export async function correctTriageLevel(patientId: string, newTriageLevel: string) {
  if (!["CRITICAL", "URGENT", "STANDARD"].includes(newTriageLevel)) {
    return { success: false, error: "Invalid triage level" };
  }

  const { error } = await supabaseAdmin
    .from("patients")
    .update({ triage_level: newTriageLevel })
    .eq("id", patientId);

  if (error) return { success: false, error: error.message };

  // Trigger ML model retrain in the background
  try {
    const { retrainModel } = await import("./ml-triage");
    const stats = await retrainModel();
    console.log(`🧠 ML Retrain triggered by doctor feedback | ${stats.totalSamples} total samples`);
  } catch (err) {
    console.error("ML retrain after correction failed:", err);
  }

  return { success: true };
}

/**
 * 📱 PATIENT LIVE TRACKING
 */

export async function getPatientLiveStatus(patientId: string) {
  const { data: patient } = await supabaseAdmin
    .from("patients")
    .select("*, doctors(*)")
    .eq("id", patientId)
    .single();

  if (!patient) return null;

  const doc = patient.doctors;
  if (!doc) return null;

  // Fetch full queue list to calculate ML Priority sorting correctly
  const { data: queueData } = await supabaseAdmin
    .from("patients")
    .select("id, token_id, created_at, triage_level")
    .eq("doctor_id", doc.id)
    .eq("status", "WAITING");

  let queueList: any[] = [];
  let peopleAhead = 0;
  let estimatedWaitMins = 0;
  let finalAhead = 0;

  if (queueData) {
    const triageWeight: Record<string, number> = { CRITICAL: 0, URGENT: 1, STANDARD: 2 };
    const sortedQueue = [...queueData].sort((a, b) => {
      const weightA = triageWeight[a.triage_level || "STANDARD"] ?? 2;
      const weightB = triageWeight[b.triage_level || "STANDARD"] ?? 2;
      if (weightA !== weightB) return weightA - weightB;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    const myIndex = sortedQueue.findIndex(p => p.id === patientId);
    peopleAhead = myIndex > -1 ? myIndex : 0;

    // 🧠 ML-Predicted consultation times per patient
    const { predictConsultationTime } = await import("./ml-triage");
    const doctorAvgMs = doc.avg_consultation_time_ms || 600000;

    // Start with estimated remaining time for in-cabin patient
    let cumulativeWaitMs = 0;
    if (doc.current_patient_id) {
      cumulativeWaitMs += Math.round(doctorAvgMs * 0.5);
    }

    let myEstimatedWaitMs = 0;

    for (let i = 0; i < sortedQueue.length; i++) {
      const p = sortedQueue[i];
      const predictedMs = await predictConsultationTime(doc.id, p.triage_level || "STANDARD", doctorAvgMs);
      const predictedMins = Math.round(predictedMs / 60000);

      // Record the patient's wait at this point (before their consultation)
      const waitFromNowMins = Math.round(cumulativeWaitMs / 60000);

      if (p.id === patientId) {
        myEstimatedWaitMs = cumulativeWaitMs;
      }

      queueList.push({
        tokenId: p.token_id,
        position: i + 1,
        isYou: p.id === patientId,
        triageLevel: p.triage_level || "STANDARD",
        estimatedMins: predictedMins,
        waitFromNow: waitFromNowMins,
      });

      cumulativeWaitMs += predictedMs;
    }

    estimatedWaitMins = Math.round(myEstimatedWaitMs / 60000);
    finalAhead = (peopleAhead || 0) + (doc.current_patient_id ? 1 : 0);
  }

  // Fetch currently serving token ID
  let currentlyServing = null;
  if (doc.current_patient_id) {
    const { data: cp } = await supabaseAdmin
      .from("patients")
      .select("token_id")
      .eq("id", doc.current_patient_id)
      .single();
    currentlyServing = cp?.token_id;
  }

  return {
    patient: {
        ...patient,
        tokenId: patient.token_id // Mapping for frontend consistency
    },
    doctor: {
      name: doc.name,
      department: doc.department,
      room: doc.room,
      currentAverageMins: Math.round(doc.avg_consultation_time_ms / 60000),
    },
    liveTracking: {
      peopleAhead: finalAhead,
      estimatedWaitMins,
      isNext: peopleAhead === 0,
      currentlyServing,
      queueList,
    },
  };
}

export async function getSystemState() {
  const { data: doctors } = await supabaseAdmin.from("doctors").select("*");
  const { data: patients } = await supabaseAdmin.from("patients").select("*");
  return { doctors, patients };
}

/**
 * 📊 AI INSIGHTS & LEARNING
 */

export async function getHospitalInsights() {
  const { getLatestInsights } = await import("./insights-engine");
  return await getLatestInsights();
}

