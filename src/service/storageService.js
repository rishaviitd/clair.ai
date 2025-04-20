/**
 * Service to handle local storage operations for analysis results and quizzes
 */

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

// Function to store quiz in localStorage
export const storeQuizResult = (quiz) => {
  try {
    // Get existing quizzes or initialize empty array
    const existingQuizzes = JSON.parse(
      localStorage.getItem("notesQuizResults") || "[]"
    );

    // Add new quiz with timestamp if it doesn't already have an id
    const quizWithTimestamp = quiz.id
      ? quiz
      : {
          ...quiz,
          timestamp: new Date().toISOString(),
          id: `quiz_${Date.now()}`,
        };

    // Store updated quizzes
    const updatedQuizzes = [...existingQuizzes, quizWithTimestamp];
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

// Function to get all stored quizzes
export const getStoredQuizzes = () => {
  try {
    return JSON.parse(localStorage.getItem("notesQuizResults") || "[]");
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
    return quizzes.find((quiz) => quiz.id === id);
  } catch (error) {
    console.error("Error retrieving quiz from localStorage:", error);
    return null;
  }
};
