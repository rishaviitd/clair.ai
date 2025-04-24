/**
 * Service to handle local storage operations for analysis results and quizzes
 */
import { convertBackslashesInObject } from "../utils/questionParser";

// Function to store analysis results in localStorage
export const storeAnalysisResult = (result) => {
  try {
    // Get existing results or initialize empty array
    const existingResults = JSON.parse(
      localStorage.getItem("notesAnalysisResults") || "[]"
    );

    // Add new result with timestamp
    const resultWithTimestamp = {
      ...result,
      timestamp: new Date().toISOString(),
      id: `result_${Date.now()}`,
    };

    // Store updated results
    const updatedResults = [...existingResults, resultWithTimestamp];
    localStorage.setItem(
      "notesAnalysisResults",
      JSON.stringify(updatedResults)
    );

    return resultWithTimestamp;
  } catch (error) {
    console.error("Error storing result in localStorage:", error);
    return result;
  }
};

/**
 * Process quiz data to preserve LaTeX backslashes before storage
 * @param {Object} quiz - The quiz object to process
 * @returns {Object} - Processed quiz with proper backslash handling
 */
const processQuizForStorage = (quiz) => {
  if (!quiz.quizQuestions || !Array.isArray(quiz.quizQuestions)) {
    return quiz;
  }

  // Deep clone the quiz to avoid modifying the original
  const processedQuiz = JSON.parse(JSON.stringify(quiz));

  // Process each question to properly escape LaTeX backslashes
  processedQuiz.quizQuestions = processedQuiz.quizQuestions.map((question) => {
    // Double the backslashes in LaTeX expressions to survive JSON.stringify
    if (question.question) {
      question.question = question.question.replace(/\\/g, "\\\\");
    }

    if (question.explanation) {
      question.explanation = question.explanation.replace(/\\/g, "\\\\");
    }

    if (question.options && Array.isArray(question.options)) {
      question.options = question.options.map((option) => {
        if (option.text) {
          option.text = option.text.replace(/\\/g, "\\\\");
        }
        return option;
      });
    }

    if (question.sampleAnswer) {
      question.sampleAnswer = question.sampleAnswer.replace(/\\/g, "\\\\");
    }

    return question;
  });

  return processedQuiz;
};

// Function to store quiz in localStorage
export const storeQuizResult = (quiz) => {
  try {
    // Get existing quizzes or initialize empty array
    const existingQuizzes = JSON.parse(
      localStorage.getItem("notesQuizResults") || "[]"
    );

    // Determine the quiz number (1, 2, 3, etc.) by counting existing quizzes
    let quizNumber = 1; // Default to 1 if no quizzes exist

    if (existingQuizzes.length > 0) {
      // Find the highest quiz number and add 1
      const highestQuizNumber = existingQuizzes.reduce((highest, q) => {
        if (q.quizNumber && q.quizNumber > highest) {
          return q.quizNumber;
        }
        return highest;
      }, 0);

      quizNumber = highestQuizNumber + 1;
    }

    // Add new quiz with timestamp and quiz number if it doesn't already have an id
    const quizWithTimestamp = quiz.id
      ? quiz
      : {
          ...quiz,
          timestamp: new Date().toISOString(),
          id: `quiz_${Date.now()}`,
          quizNumber: quizNumber,
        };

    // Process the quiz to handle LaTeX backslashes properly
    const processedQuiz = processQuizForStorage(quizWithTimestamp);

    // Store updated quizzes
    const updatedQuizzes = [...existingQuizzes, processedQuiz];
    localStorage.setItem("notesQuizResults", JSON.stringify(updatedQuizzes));

    return quizWithTimestamp;
  } catch (error) {
    console.error("Error storing quiz in localStorage:", error);
    return quiz;
  }
};

// Function to get all stored analysis results
export const getStoredAnalysisResults = () => {
  try {
    return JSON.parse(localStorage.getItem("notesAnalysisResults") || "[]");
  } catch (error) {
    console.error("Error retrieving results from localStorage:", error);
    return [];
  }
};

/**
 * Process quiz data retrieved from storage to restore proper LaTeX backslashes
 * @param {Array} quizzes - Array of quizzes from localStorage
 * @returns {Array} - Processed quizzes with proper backslash handling
 */
const processQuizzesFromStorage = (quizzes) => {
  if (!Array.isArray(quizzes)) {
    return quizzes;
  }

  return quizzes.map((quiz) => {
    if (!quiz.quizQuestions || !Array.isArray(quiz.quizQuestions)) {
      return quiz;
    }

    // Process each question to restore LaTeX backslashes
    quiz.quizQuestions = quiz.quizQuestions.map((question) => {
      // Convert double backslashes back to single for proper LaTeX rendering
      if (question.question) {
        question.question = question.question.replace(/\\\\/g, "\\");
      }

      if (question.explanation) {
        question.explanation = question.explanation.replace(/\\\\/g, "\\");
      }

      if (question.options && Array.isArray(question.options)) {
        question.options = question.options.map((option) => {
          if (option.text) {
            option.text = option.text.replace(/\\\\/g, "\\");
          }
          return option;
        });
      }

      if (question.sampleAnswer) {
        question.sampleAnswer = question.sampleAnswer.replace(/\\\\/g, "\\");
      }

      return question;
    });

    return quiz;
  });
};

// Function to get all stored quizzes
export const getStoredQuizzes = () => {
  try {
    const quizzes = JSON.parse(
      localStorage.getItem("notesQuizResults") || "[]"
    );
    return processQuizzesFromStorage(quizzes);
  } catch (error) {
    console.error("Error retrieving quizzes from localStorage:", error);
    return [];
  }
};

// Function to get a specific analysis result by ID
export const getStoredAnalysisResultById = (id) => {
  try {
    const results = JSON.parse(
      localStorage.getItem("notesAnalysisResults") || "[]"
    );
    return results.find((result) => result.id === id);
  } catch (error) {
    console.error("Error retrieving result from localStorage:", error);
    return null;
  }
};

// Function to get a specific quiz by ID
export const getStoredQuizById = (id) => {
  try {
    const quizzes = JSON.parse(
      localStorage.getItem("notesQuizResults") || "[]"
    );
    const quiz = quizzes.find((quiz) => quiz.id === id);

    if (quiz) {
      // Process quiz to restore proper LaTeX backslashes
      return processQuizzesFromStorage([quiz])[0];
    }

    return null;
  } catch (error) {
    console.error("Error retrieving quiz from localStorage:", error);
    return null;
  }
};
