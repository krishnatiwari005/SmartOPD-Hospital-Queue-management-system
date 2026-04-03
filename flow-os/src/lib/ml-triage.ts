import natural from "natural";
import trainingData from "./ml-data.json";

// Initialize the Naive Bayes Classifier
const classifier = new natural.BayesClassifier();

// Dynamically train the model using our vast dataset
console.log("🧠 SmartOPD ML Engine: Training NLP Triage Model...");

Object.entries(trainingData).forEach(([level, symptomsArray]) => {
  symptomsArray.forEach((symptoms) => {
    classifier.addDocument(symptoms, level);
  });
});

// Train the engine (Runs locally in-memory on backend startup)
classifier.train();
console.log("✅ SmartOPD ML Engine: Training Complete!");

export type TriageLevel = "CRITICAL" | "URGENT" | "STANDARD";

/**
 * Parses symptoms using NLP and predicts the triage severity level.
 * @param symptoms Raw symptom string from patient
 */
export function predictTriageLevel(symptoms: string): TriageLevel {
  if (!symptoms || symptoms.trim().length === 0) {
    return "STANDARD";
  }
  
  // Use the locally trained model to classify
  const prediction = classifier.classify(symptoms);
  
  // Type coercion safely
  if (['CRITICAL', 'URGENT', 'STANDARD'].includes(prediction)) {
     return prediction as TriageLevel;
  }
  
  return "STANDARD"; // Fallback safe
}
