/**
 * Simple utility to parse quiz questions from text responses
 * that may contain markdown code blocks
 */

/**
 * Parses questions from text response which may contain JSON in markdown code blocks
 * @param {string} textResponse - The text response from the API
 * @returns {Array} - Parsed questions or empty array on failure
 */
export const parseQuestions = (textResponse) => {
  try {
    // Strip markdown code block wrappers (```json ... ```)
    const jsonString = textResponse.replace(/```json|```/g, "").trim();
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Failed to parse questions JSON:", error);
    return [];
  }
};
