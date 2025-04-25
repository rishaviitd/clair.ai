/**
 * Service to handle adaptive quiz generation based on student performance
 */

import { storeQuizResult } from "./storageService";
import { QUIZ_GENERATION_PROMPT } from "./prompts/quizPrompt";
import { getStoredQuizzes } from "./storageService";
import { parseQuestions } from "../utils/questionParser";

/**
 * Analyzes past quiz performance to build a learning profile
 * @param {string} sourceId - ID of the source material/notes
 * @returns {Object} Performance profile with incorrectly answered questions and mastery levels
 */
const analyzePerformance = (sourceId) => {
  // Get all attempted quizzes related to this source
  const allQuizzes = getStoredQuizzes();
  const relevantQuizzes = allQuizzes.filter(
    (quiz) => quiz.sourceData?.id === sourceId && quiz.attempted
  );

  if (relevantQuizzes.length === 0) {
    return null; // No performance data available yet
  }

  // Group questions by concept/topic and track performance
  const questionPerformance = {};
  const incorrectQuestions = [];

  // Process each quiz's questions and answers
  relevantQuizzes.forEach((quiz) => {
    quiz.questionScores?.forEach((score) => {
      const question = quiz.quizQuestions[score.questionNumber - 1];
      if (!question) return;

      // Extract key topic from question (can be enhanced with NLP in future)
      const topic = extractTopicFromQuestion(question);

      if (!questionPerformance[topic]) {
        questionPerformance[topic] = {
          attempts: 0,
          correct: 0,
          difficulty: 1, // Start at easy difficulty
          questionIds: [],
        };
      }

      // Update performance metrics
      questionPerformance[topic].attempts++;
      if (score.correct) {
        questionPerformance[topic].correct++;
      } else {
        // Store incorrectly answered questions to potentially repeat
        incorrectQuestions.push({
          question,
          attemptedAt: quiz.timestamp,
        });
      }

      // Track which questions were asked about this topic
      if (!questionPerformance[topic].questionIds.includes(question.id)) {
        questionPerformance[topic].questionIds.push(question.id);
      }
    });
  });

  // Calculate mastery level for each topic
  Object.keys(questionPerformance).forEach((topic) => {
    const performance = questionPerformance[topic];
    const correctRate = performance.correct / performance.attempts;

    // Update difficulty based on performance
    if (correctRate > 0.8 && performance.attempts >= 3) {
      // Mastered - increase difficulty
      performance.difficulty = Math.min(3, performance.difficulty + 1);
    } else if (correctRate < 0.4) {
      // Struggling - decrease difficulty
      performance.difficulty = Math.max(1, performance.difficulty - 1);
    }
  });

  return {
    questionPerformance,
    incorrectQuestions,
    lastQuizTimestamp: relevantQuizzes[0].timestamp,
  };
};

/**
 * Extract topic from question using simple keyword analysis
 * @param {Object} question - Question object
 * @returns {string} Extracted topic
 */
const extractTopicFromQuestion = (question) => {
  // Simple extraction - first 3 non-stop words
  // This would be replaced with proper NLP in a production app
  const stopWords = [
    "what",
    "which",
    "how",
    "when",
    "where",
    "is",
    "are",
    "the",
    "a",
    "an",
    "in",
    "on",
    "at",
    "to",
    "for",
  ];
  const text = question.question.toLowerCase();
  const words = text
    .split(/\W+/)
    .filter((word) => word.length > 2 && !stopWords.includes(word));

  return words.slice(0, 3).join("_") || "general";
};

/**
 * Generates an adaptive quiz prompt based on student performance
 * @param {Object} analysisResult - The analysis result object
 * @param {Object} performanceProfile - Student performance profile
 * @returns {string} Customized prompt for Gemini API
 */
const generateAdaptivePrompt = (analysisResult, performanceProfile) => {
  if (!performanceProfile) {
    // First quiz - use standard prompt
    return QUIZ_GENERATION_PROMPT;
  }

  // Modify the prompt to focus on weak areas and increase difficulty on mastered topics
  let adaptivePart = `Generate a quiz with 10 MCQ questions based on the notes provided.

Pay special attention to the following customization requirements:

1. REPEAT QUESTIONS: Include revised versions of questions on these topics the student previously struggled with:
`;

  // Add topics the student struggled with
  const weakTopics = Object.entries(performanceProfile.questionPerformance)
    .filter(([_, data]) => data.correct / data.attempts < 0.6)
    .map(([topic, _]) => topic);

  if (weakTopics.length > 0) {
    adaptivePart += weakTopics
      .map((topic) => `   - ${topic.replace(/_/g, " ")}`)
      .join("\n");
  } else {
    adaptivePart += "   - No specific weak topics identified yet\n";
  }

  // Add topics the student has mastered - increase difficulty
  adaptivePart += `\n2. INCREASED DIFFICULTY: Create more challenging questions for these mastered topics:
`;

  const masteredTopics = Object.entries(performanceProfile.questionPerformance)
    .filter(
      ([_, data]) => data.correct / data.attempts > 0.8 && data.attempts >= 3
    )
    .map(([topic, _]) => topic);

  if (masteredTopics.length > 0) {
    adaptivePart += masteredTopics
      .map((topic) => `   - ${topic.replace(/_/g, " ")}`)
      .join("\n");
  } else {
    adaptivePart += "   - No mastered topics identified yet\n";
  }

  // Ensure content coverage
  adaptivePart += `
3. CONTENT COVERAGE: Make sure to cover sections of the notes that haven't been tested in previous quizzes.
   Generate questions that test different aspects of the material rather than repeating the same concepts.

4. DIFFICULTY PROGRESSION: As this is quiz #${
    performanceProfile.quizCount || 1
  }, make the overall difficulty appropriate.

`;

  // Return the base prompt with our adaptive modifications
  return adaptivePart + QUIZ_GENERATION_PROMPT.split("Generate a quiz")[1];
};

/**
 * Generates an adaptive quiz based on student's previous performance
 * @param {Object} analysisResult - The analysis result object
 * @param {string} [apiKey] - Your Gemini API key (optional if set in environment variables)
 * @returns {Promise<object>} - The generated adaptive quiz
 */
export const generateAdaptiveQuiz = async (analysisResult, apiKey) => {
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

    // Analyze performance to build adaptive profile
    const performanceProfile = analyzePerformance(analysisResult.id);

    // Generate quiz number
    const quizCount = performanceProfile
      ? Object.values(performanceProfile.questionPerformance).reduce(
          (max, topic) => Math.max(max, topic.questionIds.length),
          0
        ) + 1
      : 1;

    if (performanceProfile) {
      performanceProfile.quizCount = quizCount;
    }

    // API endpoint for Gemini - use configured model or fallback to default
    const modelVersion =
      import.meta.env.VITE_GEMINI_MODEL_VERSION || "gemini-1.5-flash";
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelVersion}:generateContent`;

    console.log(
      `Using Gemini model: ${modelVersion} for adaptive quiz #${quizCount}`
    );

    // Prepare input data for the quiz generation
    // First try markdown, then fallback to other formats for backward compatibility
    const inputData = analysisResult.markdown
      ? analysisResult.markdown
      : analysisResult.structuredData
      ? JSON.stringify(analysisResult.structuredData, null, 2)
      : analysisResult.description;

    // Get adaptive prompt
    const adaptivePrompt = generateAdaptivePrompt(
      analysisResult,
      performanceProfile
    );

    // Prepare request body with appropriate configuration
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: adaptivePrompt + inputData,
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

    console.log("Sending request to Gemini API for adaptive quiz...");

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
        console.log("Text response received for adaptive quiz");
      } else {
        console.warn("No text content found in API response");
      }

      // Use our simple parser to parse the quiz questions
      console.log("Attempting to parse adaptive quiz questions...");
      const structuredQuestions = parseQuestions(rawQuizText);
      console.log(
        `Parsed ${structuredQuestions.length} structured questions for adaptive quiz`
      );

      // Create result object
      const quizResult = {
        success: true,
        quiz: rawQuizText,
        quizQuestions: structuredQuestions,
        sourceData: analysisResult,
        timestamp: new Date().toISOString(),
        id: `quiz_${Date.now()}`,
        attempted: false,
        quizNumber: quizCount,
        isAdaptive: true,
        score: {
          obtained: 0,
          total: structuredQuestions.length,
          percentage: 0,
        },
        questionScores: structuredQuestions.map((question, index) => ({
          questionNumber: index + 1,
          correct: false,
          userAnswer: null,
          correctAnswer: question.correctAnswer,
          score: 0,
        })),
      };

      // Store the raw response for troubleshooting
      quizResult.rawText = rawQuizText;
      quizResult.rawApiResponse = rawApiResponse;

      // If we have performance data, include it
      if (performanceProfile) {
        quizResult.performanceProfile = performanceProfile;
      }

      // Log what we're returning
      console.log(
        `Returning adaptive quiz #${quizCount} with ${quizResult.quizQuestions.length} structured questions`
      );

      // Store and return the quiz result
      return storeQuizResult(quizResult);
    } catch (apiError) {
      console.error("API request error:", apiError);
      throw new Error(`API request failed: ${apiError.message}`);
    }
  } catch (error) {
    console.error("Error generating adaptive quiz with Gemini:", error);
    return {
      success: false,
      error: error.message || "Failed to generate adaptive quiz",
    };
  }
};
