/**
 * Simple utility to parse quiz questions from text responses
 * that may contain markdown code blocks or extra text.
 */

/**
 * Parses questions from text response which may contain JSON in markdown code blocks
 * @param {string} textResponse - The text response from the API
 * @returns {Array} - Parsed questions or empty array on failure
 */
export const parseQuestions = (textResponse) => {
  if (!textResponse) return [];

  try {
    // Regular expression to match a JSON code block (e.g., ```json ... ```)
    const jsonBlockRegex = /```json\s*([\s\S]*?)\s*```/;
    const match = textResponse.match(jsonBlockRegex);
    let jsonString;

    if (match && match[1]) {
      // If a code block is found, extract the JSON content inside it
      jsonString = match[1].trim();
      console.log("Extracted JSON from code block:", jsonString);
    } else {
      // If no code block, assume the whole string is JSON
      jsonString = textResponse.trim();
      console.log("Assuming entire response is JSON:", jsonString);
    }

    // First, normalize all backslash sequences to single backslashes
    jsonString = jsonString.replace(/\\+/g, "\\");

    // Now convert all single backslashes to quadruple backslashes for safe JSON parsing
    jsonString = jsonString.replace(/\\/g, "\\\\\\\\");

    console.log("Backslash transformation for parsing:", jsonString);

    // Parse the JSON string into a JavaScript object
    const questions = JSON.parse(jsonString);

    // After parsing, process the questions to convert quadruple backslashes back to double
    // This will make the LaTeX render properly
    const processedQuestions = questions.map((question) => {
      // Process question text
      if (question.question) {
        question.question = question.question.replace(/\\\\/g, "\\");
      }

      // Process explanation
      if (question.explanation) {
        question.explanation = question.explanation.replace(/\\\\/g, "\\");
      }

      // Process options if they exist
      if (question.options && Array.isArray(question.options)) {
        question.options = question.options.map((option) => {
          if (option.text) {
            option.text = option.text.replace(/\\\\/g, "\\");
          }
          return option;
        });
      }

      // Process sampleAnswer for subjective questions
      if (question.sampleAnswer) {
        question.sampleAnswer = question.sampleAnswer.replace(/\\\\/g, "\\");
      }

      return question;
    });
    console.log("Processed questions:", processedQuestions);

    // Verify the parsed result is an array
    if (Array.isArray(processedQuestions)) {
      console.log("✅ Parsed and processed questions:", processedQuestions);
      return processedQuestions;
    } else {
      console.error("Processed result is not an array");
      return [];
    }
  } catch (error) {
    console.error("Error parsing JSON:", error);
    return [];
  }
};

/**
 * Helper function to recursively process all string values in an object
 * and convert quadruple backslashes to double backslashes
 * @param {any} obj - The object to process
 * @returns {any} - The processed object
 */
export const convertBackslashesInObject = (obj) => {
  // Base case: if obj is a string, replace backslashes
  if (typeof obj === "string") {
    return obj.replace(/\\\\\\\\/g, "\\\\");
  }

  // If obj is an array, process each element
  if (Array.isArray(obj)) {
    return obj.map((item) => convertBackslashesInObject(item));
  }

  // If obj is an object, process each property
  if (obj !== null && typeof obj === "object") {
    const result = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = convertBackslashesInObject(obj[key]);
      }
    }
    return result;
  }

  // Otherwise, return the original value
  return obj;
};
