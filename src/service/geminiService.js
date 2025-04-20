/**
 * Service to interact with Google's Gemini API for image processing
 * This is the main export point for all Gemini-related services
 *
 * This implementation uses Gemini API's structured schema feature to ensure consistent JSON output
 * This improves reliability of both notes analysis and quiz generation
 */

// Re-export services from specialized modules
export { processImageWithGemini } from "./notesProcessingService";
export { generateQuizFromNotes } from "./quizGenerationService";
export {
  storeAnalysisResult,
  storeQuizResult,
  getStoredAnalysisResults,
  getStoredQuizzes,
  getStoredAnalysisResultById,
  getStoredQuizById,
} from "./storageService";

// Export schema types for potential use in other parts of the application
export { Type as SchemaType } from "./types/quizSchema";
export { quizQuestionsSchema } from "./types/quizSchema";
export { notesStructureSchema } from "./types/notesSchema";
