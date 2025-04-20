/**
 * Service to generate quizzes from analyzed notes using Gemini API
 */

import { storeQuizResult } from "./storageService";
import { QUIZ_GENERATION_PROMPT } from "./prompts/quizPrompt";
import { quizQuestionsSchema, parseQuizQuestions } from "./types/quizSchema";

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
      (!analysisResult.structuredData && !analysisResult.description)
    ) {
      throw new Error("No valid analysis data provided for quiz generation");
    }

    // API endpoint for Gemini - use configured model or fallback to default
    const modelVersion =
      import.meta.env.VITE_GEMINI_MODEL_VERSION || "gemini-1.5-flash";
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelVersion}:generateContent`;

    // Prepare input data for the quiz generation
    const inputData = analysisResult.structuredData
      ? JSON.stringify(analysisResult.structuredData, null, 2)
      : analysisResult.description;

    // Check if we should try to use schema (based on model version)
    const useSchema = modelVersion.includes("gemini-pro-2"); // Only use schema with full release versions

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

    // Add schema configuration only if using a compatible model
    if (useSchema) {
      requestBody.generationConfig.responseSchema = quizQuestionsSchema;
    }

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
      throw new Error(
        `API error: ${errorData.error?.message || response.statusText}`
      );
    }

    const data = await response.json();

    // Log response for debugging
    console.log("===== GEMINI API RESPONSE =====");
    console.log(
      "Response structure:",
      JSON.stringify(data).substring(0, 200) + "..."
    );

    // Extract text content from the response
    let rawQuizText = "";
    if (
      data.candidates &&
      data.candidates[0] &&
      data.candidates[0].content?.parts &&
      data.candidates[0].content.parts[0]?.text
    ) {
      rawQuizText = data.candidates[0].content.parts[0].text;
      console.log("Text response received");
      console.log("Text sample:", rawQuizText.substring(0, 200) + "...");
    }

    // Use Zod schema to parse and normalize the quiz questions
    const structuredQuestions = parseQuizQuestions(rawQuizText);
    console.log(
      `Parsed ${structuredQuestions.length} structured questions using Zod schema`
    );

    // Create result object
    const quizResult = {
      success: true,
      quiz: rawQuizText,
      quizQuestions: structuredQuestions,
      sourceData: analysisResult,
      timestamp: new Date().toISOString(),
      id: `quiz_${Date.now()}`,
    };

    // Log what we're returning
    console.log(
      `Returning quiz with ${quizResult.quizQuestions.length} structured questions`
    );

    // Store and return the quiz result
    return storeQuizResult(quizResult);
  } catch (error) {
    console.error("Error generating quiz with Gemini:", error);
    return {
      success: false,
      error: error.message || "Failed to generate quiz",
    };
  }
};
