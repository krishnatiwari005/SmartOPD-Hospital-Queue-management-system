// src/lib/db.ts
// SmartOPD: Intelligent Hospital Queue SaaS — Core Engine

export type PatientStatus = "WAITING" | "IN_CABIN" | "COMPLETED" | "SKIPPED";

export interface Patient {
  id: string;
  tokenId: string; // e.g., 'OPD-042'
  name: string;
  phone: string;
  doctorId: string;
  status: PatientStatus;
  joinedAt: number;
  cabinEntryTime?: number; // Used to calculate how long the consultation took
}

export interface Doctor {
  id: string;
  name: string;
  department: string;
  room: string;
  averageConsultationTimeMs: number; // The ML core logic
  patientsSeenToday: number;
  currentPatientId: string | null;
  queue: string[]; // Ordered array of patient IDs that are WAITING
  totalTokensGenerated: number;
}

export interface Database {
  doctors: Record<string, Doctor>;
  patients: Record<string, Patient>;
}

// === IN-MEMORY SEED & STORE ===
const globalDb = globalThis as unknown as { __smartopd_db?: Database };

if (!globalDb.__smartopd_db) {
  globalDb.__smartopd_db = {
    doctors: {
      "doc-ortho": {
        id: "doc-ortho",
        name: "Dr. A. Sharma",
        department: "Orthopedics",
        room: "Room 101",
        averageConsultationTimeMs: 10 * 60 * 1000, // 10 mins base
        patientsSeenToday: 0,
        currentPatientId: null,
        queue: [],
        totalTokensGenerated: 0,
      },
      "doc-derma": {
        id: "doc-derma",
        name: "Dr. R. Kapoor",
        department: "Dermatology",
        room: "Room 205",
        averageConsultationTimeMs: 6 * 60 * 1000, // 6 mins base
        patientsSeenToday: 0,
        currentPatientId: null,
        queue: [],
        totalTokensGenerated: 0,
      },
      "doc-gen": {
        id: "doc-gen",
        name: "Dr. M. Singh",
        department: "General Medicine",
        room: "Room 10",
        averageConsultationTimeMs: 4 * 60 * 1000, // 4 mins base
        patientsSeenToday: 0,
        currentPatientId: null,
        queue: [],
        totalTokensGenerated: 0,
      },
    },
    patients: {}
  };
}
const db = globalDb.__smartopd_db;

function genId(): string {
  return Math.random().toString(36).substring(2, 11);
}

// === CORE SYSTEM FUNCTIONS ===

export function getSystemState() {
  return {
    doctors: Object.values(db.doctors),
    patients: db.patients,
  };
}

export function getDoctor(id: string): Doctor | null {
  return db.doctors[id] || null;
}

export function getPatient(id: string): Patient | null {
  return db.patients[id] || null;
}

export function addPatient(doctorId: string, name: string, phone: string): Patient | null {
  const doc = db.doctors[doctorId];
  if (!doc) return null;

  doc.totalTokensGenerated += 1;
  const tokenNum = doc.totalTokensGenerated.toString().padStart(3, "0");
  const prefix = doc.department.substring(0, 3).toUpperCase();
  const tokenId = `${prefix}-${tokenNum}`;

  const patient: Patient = {
    id: genId(),
    tokenId,
    name: name || "Unknown Patient",
    phone,
    doctorId,
    status: "WAITING",
    joinedAt: Date.now(),
  };

  db.patients[patient.id] = patient;
  doc.queue.push(patient.id);

  return patient;
}

/**
 * 🧠 The Core ML Controller: "Call Next"
 * Finishes the current patient, calculates exact time spent to update the rolling average,
 * and shifts the queue to bring the next person In-Cabin.
 */
export function callNext(doctorId: string) {
  const doc = db.doctors[doctorId];
  if (!doc) return { success: false, error: "Doctor not found" };

  const now = Date.now();

  // 1. If someone is currently in the cabin, complete them and learn from it.
  if (doc.currentPatientId) {
    const currentPatient = db.patients[doc.currentPatientId];
    if (currentPatient && currentPatient.status === "IN_CABIN") {
      currentPatient.status = "COMPLETED";

      // 🧠 ML Learning: Update moving average
      if (currentPatient.cabinEntryTime) {
        const timeSpentMs = now - currentPatient.cabinEntryTime;
        // Basic Exponential Moving Average (EMA). Prevent crazy outliers.
        const effectiveTimeMs = Math.min(Math.max(timeSpentMs, 60000), 1800000); // Between 1m and 30m
        
        doc.averageConsultationTimeMs = Math.round(
          (doc.averageConsultationTimeMs * doc.patientsSeenToday + effectiveTimeMs) /
          (doc.patientsSeenToday + 1)
        );
        doc.patientsSeenToday += 1;
      }
    }
    doc.currentPatientId = null;
  }

  // 2. Pop next waiting patient
  if (doc.queue.length > 0) {
    const nextPatientId = doc.queue.shift()!;
    doc.currentPatientId = nextPatientId;
    
    const nextPatient = db.patients[nextPatientId];
    if (nextPatient) {
      nextPatient.status = "IN_CABIN";
      nextPatient.cabinEntryTime = now;
    }
  }

  return { success: true, doc };
}

/**
 * The Skip Logic: Patient is missing.
 * Push the current in-cabin patient to the END of the queue.
 */
export function skipCurrentPatient(doctorId: string) {
  const doc = db.doctors[doctorId];
  if (!doc) return { success: false, error: "Doctor not found" };

  if (doc.currentPatientId) {
    const patient = db.patients[doc.currentPatientId];
    if (patient) {
      // Reinsert at the end of the line
      patient.status = "WAITING";
      patient.cabinEntryTime = undefined;
      doc.queue.push(patient.id);
    }
    doc.currentPatientId = null;
  }

  // Auto-call the next person since we skipped
  return callNext(doctorId);
}

/**
 * Generates the live tracking payload for a specific patient.
 */
export function getPatientLiveStatus(patientId: string) {
  const patient = db.patients[patientId];
  if (!patient) return null;

  const doc = db.doctors[patient.doctorId];
  if (!doc) return null;

  const positionIndex = doc.queue.indexOf(patient.id);

  let peopleAhead = 0;
  let estimatedWaitMins = 0;

  if (patient.status === "IN_CABIN") {
    peopleAhead = 0;
    estimatedWaitMins = 0;
  } else if (patient.status === "WAITING" && positionIndex !== -1) {
    peopleAhead = positionIndex + (doc.currentPatientId ? 1 : 0);
    estimatedWaitMins = Math.round((peopleAhead * doc.averageConsultationTimeMs) / 60000);
  }

  // Currently serving token
  const currentlyServing = doc.currentPatientId
    ? db.patients[doc.currentPatientId]?.tokenId
    : null;

  // Full queue list for context
  const queueList = doc.queue.map((pid, idx) => ({
    tokenId: db.patients[pid]?.tokenId,
    position: idx + 1,
    isYou: pid === patientId,
  }));

  return {
    patient,
    doctor: {
      name: doc.name,
      department: doc.department,
      room: doc.room,
      currentAverageMins: Math.round(doc.averageConsultationTimeMs / 60000),
    },
    liveTracking: {
      peopleAhead,
      estimatedWaitMins,
      isNext: positionIndex === 0,
      currentlyServing,
      queueList,
    },
  };
}

