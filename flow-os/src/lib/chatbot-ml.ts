import natural from "natural";
import trainingData from "./chatbot-data.json";

// ─── Multilingual Chatbot ML Classifier ───────────────────────────────
// This classifier handles both English and Hindi (Hinglish) phrasings.

let classifier = new natural.BayesClassifier();

// ─── Step 1: Initial Training Logic ───
function trainClassifier() {
  const c = new natural.BayesClassifier();
  Object.entries(trainingData).forEach(([intent, phrases]) => {
    (phrases as string[]).forEach((phrase: string) => {
      c.addDocument(phrase.toLowerCase(), intent);
    });
  });
  c.train();
  classifier = c;
  console.log("🧠 Chatbot ML: Trained on 120+ bilingual phrases.");
}

// Perform initial train
trainClassifier();

/**
 * Identifies the intent of a user message.
 * Handles typos and mixed language (Hinglish).
 */
export function identifyIntent(message: string): string {
  if (!message || message.trim().length === 0) return "UNKNOWN";
  
  const query = message.toLowerCase().trim();
  const intent = classifier.classify(query);
  
  // Basic confidence check: if it's very short and no match, return greeting fallback
  if (query.length < 3) return "GREETING";

  return intent;
}

/**
 * Returns a score-based classification (optional extension).
 */
export function getIntentScores(message: string) {
  return classifier.getClassifications(message.toLowerCase());
}
