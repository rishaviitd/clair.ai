/**
 * Service to generate quizzes from analyzed notes using Gemini API
 */

import { storeQuizResult } from "./storageService";
import { QUIZ_GENERATION_PROMPT } from "./prompts/quizPrompt";
import { parseQuestions } from "../utils/questionParser";

/**
 * Generates a quiz based on analyzed notes data
 * @param {Object} analysisResult - The analysis result object
 * @param {string} [apiKey] - Your Gemini API key (optional if set in environment variables)
 * @returns {Promise<object>} - The generated quiz
 */
export const generateQuizFromNotes = async (analysisResult, apiKey) => {
  try {
    // Use provided API key or fall back to environment variable
    const key = apiKey || import.meta.env.VITE_GEMINI_API_KEY;

    if (!key || key === "your_gemini_api_key_here") {
      throw new Error(
        "No valid API key provided. Please provide a Gemini API key."
      );
    }

    if (
      !analysisResult ||
      (!analysisResult.structuredData &&
        !analysisResult.description &&
        !analysisResult.markdown)
    ) {
      throw new Error("No valid analysis data provided for quiz generation");
    }

    // API endpoint for Gemini - use configured model or fallback to default
    const modelVersion =
      import.meta.env.VITE_GEMINI_MODEL_VERSION || "gemini-1.5-flash";
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelVersion}:generateContent`;

    console.log(`Using Gemini model: ${modelVersion}`);

    // Prepare input data for the quiz generation
    // First try markdown, then fallback to other formats for backward compatibility
    const inputData = analysisResult.markdown
      ? analysisResult.markdown
      : analysisResult.structuredData
      ? JSON.stringify(analysisResult.structuredData, null, 2)
      : analysisResult.description;

    // Prepare request body with appropriate configuration
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: QUIZ_GENERATION_PROMPT + inputData,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 65536,
      },
    };

    // We're intentionally NOT using the schema to simplify responses

    console.log("Sending request to Gemini API...");

    try {
      // Make API request
      const response = await fetch(`${endpoint}?key=${key}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error?.message || response.statusText;
        console.error("API Error:", errorMessage);
        throw new Error(`API error: ${errorMessage}`);
      }

      const data = await response.json();

      // Log response for debugging
      console.log("===== GEMINI API RESPONSE =====");
      console.log(data.candidates[0].content.parts[0].text);

      // Extract text content from the response
      let rawQuizText = "";
      let rawApiResponse = JSON.stringify(data, null, 2);

      if (
        data.candidates &&
        data.candidates[0] &&
        data.candidates[0].content?.parts &&
        data.candidates[0].content.parts[0]?.text
      ) {
        rawQuizText = data.candidates[0].content.parts[0].text;
        console.log("Text response received");
      } else {
        console.warn("No text content found in API response");
      }

      // Use our simple parser to parse the quiz questions
      console.log("Attempting to parse quiz questions...");
      console.log(rawQuizText);
      const structuredQuestions = parseQuestions(rawQuizText);
      console.log(structuredQuestions);
      console.log(`Parsed ${structuredQuestions.length} structured questions`);

      // Create result object
      const quizResult = {
        success: true,
        quiz: rawQuizText,
        quizQuestions: structuredQuestions,
        sourceData: analysisResult,
        timestamp: new Date().toISOString(),
        id: `quiz_${Date.now()}`,
      };

      // Store the raw response for troubleshooting
      quizResult.rawText = rawQuizText;
      quizResult.rawApiResponse = rawApiResponse;

      // Log what we're returning
      console.log(
        `Returning quiz with ${quizResult.quizQuestions.length} structured questions`
      );

      // Store and return the quiz result
      return storeQuizResult(quizResult);
    } catch (apiError) {
      console.error("API request error:", apiError);
      throw new Error(`API request failed: ${apiError.message}`);
    }
  } catch (error) {
    console.error("Error generating quiz with Gemini:", error);
    return {
      success: false,
      error: error.message || "Failed to generate quiz",
    };
  }
};
