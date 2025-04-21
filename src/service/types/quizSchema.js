/**
 * Type definitions for the quiz schema based on Google's Gemini API schema format
 */

import { z } from "zod";
import { jsonrepair } from "jsonrepair";

// Enum for schema types (based on OpenAPI Data Types)
export const Type = {
  STRING: "string",
  INTEGER: "integer",
  NUMBER: "number",
  BOOLEAN: "boolean",
  ARRAY: "array",
  OBJECT: "object",
};

/**
 * Quiz question schema for structured output from Gemini API
 * This schema defines the structure for quiz questions, both MCQ and subjective types
 */
export const quizQuestionsSchema = {
  type: Type.ARRAY,
  minItems: 5,
  maxItems: 10,
  items: {
    type: Type.OBJECT,
    properties: {
      id: {
        type: Type.STRING,
        description: "Unique identifier for the question",
        nullable: false,
      },
      type: {
        type: Type.STRING,
        description: "Type of question (mcq or subjective)",
        enum: ["mcq", "subjective"],
        nullable: false,
      },
      question: {
        type: Type.STRING,
        description:
          "The question text, may include LaTeX for mathematical formulas",
        nullable: false,
      },
      options: {
        type: Type.ARRAY,
        description: "Answer options for MCQ questions",
        items: {
          type: Type.OBJECT,
          properties: {
            id: {
              type: Type.STRING,
              description: "Identifier for the option (typically a, b, c, d)",
              nullable: false,
            },
            text: {
              type: Type.STRING,
              description:
                "Text of the option, may include LaTeX for mathematical formulas",
              nullable: false,
            },
          },
          required: ["id", "text"],
        },
      },
      correctAnswer: {
        type: Type.STRING,
        description: "ID of the correct option for MCQ questions",
      },
      explanation: {
        type: Type.STRING,
        description: "Explanation for the correct answer",
      },
      sampleAnswer: {
        type: Type.STRING,
        description: "Sample answer for subjective questions",
      },
      topic: {
        type: Type.STRING,
        description: "The topic this question relates to",
      },
    },
    required: ["id", "type", "question"],
    propertyOrdering: [
      "id",
      "type",
      "question",
      "options",
      "correctAnswer",
      "explanation",
      "sampleAnswer",
      "topic",
    ],
  },
};

/**
 * Zod schema for an MCQ option
 */
const mcqOptionSchema = z.object({
  id: z.string(),
  text: z.string(),
});

/**
 * Alternative Zod schema for options as an object with keys
 * This will be transformed into the standard format
 */
const optionsObjectSchema = z.record(z.string(), z.string());

/**
 * Zod schema for MCQ questions
 */
const mcqQuestionSchema = z
  .object({
    id: z.string().optional(),
    type: z.literal("mcq").optional().default("mcq"),
    question: z.string(),
    options: z
      .union([
        // Standard array format
        z.array(mcqOptionSchema),

        // Object format like {"a": "Option A", "b": "Option B"}
        optionsObjectSchema.transform((obj) => {
          return Object.entries(obj).map(([key, value]) => ({
            id: key,
            text: value,
          }));
        }),

        // Array of strings format
        z.array(z.string()).transform((arr) => {
          return arr.map((text, index) => ({
            id: String.fromCharCode(97 + index), // a, b, c, d...
            text,
          }));
        }),
      ])
      .optional()
      .default([]),

    // Accept either correctAnswer or answer
    correctAnswer: z.string().optional(),
    answer: z.string().optional(),

    explanation: z.string().optional().default(""),
    topic: z.string().optional().default(""),
  })
  .transform((data) => {
    // Copy all fields
    const result = { ...data };

    // Handle the case where answer is used instead of correctAnswer
    if (!result.correctAnswer && result.answer) {
      result.correctAnswer = result.answer;
      delete result.answer;
    }

    // Ensure we have a valid ID
    if (!result.id) {
      result.id = `q${Math.random().toString(36).substr(2, 6)}`;
    }

    // Create default options if none exist
    if (!result.options || result.options.length === 0) {
      result.options = [
        { id: "a", text: "Option A" },
        { id: "b", text: "Option B" },
        { id: "c", text: "Option C" },
        { id: "d", text: "Option D" },
      ];
    }

    // Ensure we have a correctAnswer
    if (!result.correctAnswer) {
      result.correctAnswer = result.options[0].id;
    }

    return result;
  });

/**
 * Zod schema for subjective questions
 */
const subjectiveQuestionSchema = z
  .object({
    id: z.string().optional(),
    type: z.literal("subjective").optional().default("subjective"),
    question: z.string(),

    // Accept either sampleAnswer or sample_answer
    sampleAnswer: z.string().optional(),
    sample_answer: z.string().optional(),

    topic: z.string().optional().default(""),
  })
  .transform((data) => {
    // Copy all fields
    const result = { ...data };

    // Handle the case where sample_answer is used instead of sampleAnswer
    if (!result.sampleAnswer && result.sample_answer) {
      result.sampleAnswer = result.sample_answer;
      delete result.sample_answer;
    }

    // Ensure we have a valid ID
    if (!result.id) {
      result.id = `q${Math.random().toString(36).substr(2, 6)}`;
    }

    // Ensure we have a sampleAnswer
    if (!result.sampleAnswer) {
      result.sampleAnswer = "No sample answer provided";
    }

    return result;
  });

/**
 * Zod schema for any question type
 */
export const questionSchema = z.union([
  mcqQuestionSchema,
  subjectiveQuestionSchema,
]);

/**
 * Zod schema for an array of questions
 */
export const questionsArraySchema = z.array(questionSchema);

/**
 * Zod schema for quiz object with a 'quiz' property containing questions
 */
export const quizObjectSchema = z
  .object({
    quiz: z.array(questionSchema),
  })
  .transform((data) => data.quiz);

/**
 * Aggressively repairs JSON from Gemini API responses
 * Targets specific common error patterns that Gemini produces
 * @param {string} jsonString - The potentially malformed JSON string
 * @returns {string} - Fixed JSON string
 */
function aggressiveJSONRepair(jsonString) {
  if (!jsonString) return "[]";

  console.log("Starting aggressive JSON repair");

  // NEW: Fix for incorrectly escaped quotes in property names and values
  // This pattern is common in Gemini responses: "key\": "value\"
  jsonString = jsonString
    // Fix property names with escaped quotes
    .replace(/"([a-zA-Z0-9_]+)\\"/g, '"$1"')
    // Fix closing quotes in values that are escaped
    .replace(/:\\s*"([^"\\]*?)\\"/g, ': "$1"')
    // Fix quotes around LaTeX content
    .replace(/"\\\\?\(([^)]+?)\\\\?\)\\"/g, '"\\($1\\)"');

  // NEW: Direct check for the specific error pattern at position 18
  if (jsonString.length > 20) {
    // Look for line 3, column 13 issue (Expected ':' after property name)
    // This often happens with property names that aren't quoted properly
    const lines = jsonString.split("\n");
    if (lines.length >= 3) {
      const line3 = lines[2]; // 0-indexed array, so index 2 is line 3
      console.log("Line 3:", line3);

      if (line3.length >= 13) {
        // Check if there's a problem around column 13
        const problemArea = line3.substring(
          Math.max(0, 12 - 5),
          Math.min(line3.length, 12 + 10)
        );
        console.log("Problem area around position:", problemArea);

        // Try to detect if this is a property name missing quotes or colon
        const propNameMatch = line3.match(/\s*([a-zA-Z0-9_]+)(\s*)([^:"])/);
        if (propNameMatch) {
          console.log(
            `Possible unquoted property name detected: "${propNameMatch[1]}"`
          );

          // Fix the specific line
          lines[2] = line3.replace(
            new RegExp(`\\s*(${propNameMatch[1]})\\s*([^:"])`, "g"),
            ` "${propNameMatch[1]}": $2`
          );

          jsonString = lines.join("\n");
          console.log("Fixed line 3:", lines[2]);
        }
      }
    }
  }

  // Step 1: Remove any markdown code blocks and extract just the JSON
  let cleaned = jsonString;
  const codeBlockMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) {
    cleaned = codeBlockMatch[1].trim();
    console.log("Removed markdown code blocks");
  }

  // Step 2: Extract only the array portion if mixed with text
  if (cleaned.includes("[") && cleaned.includes("]")) {
    const startIdx = cleaned.indexOf("[");
    const endIdx = cleaned.lastIndexOf("]") + 1;
    if (startIdx >= 0 && endIdx > startIdx) {
      cleaned = cleaned.substring(startIdx, endIdx);
      console.log("Extracted array portion");
    }
  }

  // Additional check: Log the first 30 characters to help debug
  console.log("First 30 chars of cleaned JSON:", cleaned.substring(0, 30));

  // Extra check: Identify if the first non-whitespace char is not [
  const firstNonWhitespace = cleaned.match(/\S/);
  if (firstNonWhitespace && firstNonWhitespace[0] !== "[") {
    console.error(
      "JSON doesn't start with array bracket! Found:",
      firstNonWhitespace[0]
    );
    console.log("Fixing array start...");

    // Check if it's an object starting with { instead of an array
    if (firstNonWhitespace[0] === "{") {
      // Wrap it with array brackets
      cleaned = "[" + cleaned + "]";
      console.log("Wrapped object in array brackets");
    } else {
      // Find the first [ and extract from there
      const arrayStart = cleaned.indexOf("[");
      if (arrayStart >= 0) {
        cleaned = cleaned.substring(arrayStart);
        console.log("Trimmed content before first [");
      } else {
        // Force it to be an empty array if no [ is found
        cleaned = "[]";
        console.log("No array brackets found, defaulting to empty array");
      }
    }
  }

  // NEW: Look for and fix specific pattern of inconsistent escaping of quotes
  cleaned = cleaned
    // Fix property with escaped quotes: "id\": "value"
    .replace(/"([a-zA-Z0-9_]+)\\"/g, '"$1"')

    // Fix values with escaped quotes: "text\":
    .replace(/:\\s*"([^"\\]*?)\\"/g, ': "$1"')

    // Fix LaTeX content with escaped parens
    .replace(/"\\\\?\(([^)]+?)\\\\?\)\\"/g, '"\\($1\\)"')

    // Fix escaped backslashes in LaTeX (normalize to single backslashes)
    .replace(/\\{2,}([a-zA-Z]+\{)/g, "\\$1")
    .replace(/\\{2,}([a-zA-Z]+)/g, "\\$1")

    // Fix LaTeX fractions with too many backslashes
    .replace(/\\{2,}frac/g, "\\frac")
    .replace(/\\{2,}Delta/g, "\\Delta")
    .replace(/\\{2,}delta/g, "\\delta")
    .replace(/\\{2,}alpha/g, "\\alpha")
    .replace(/\\{2,}beta/g, "\\beta")
    .replace(/\\{2,}gamma/g, "\\gamma")
    .replace(/\\{2,}sum/g, "\\sum")
    .replace(/\\{2,}int/g, "\\int")
    .replace(/\\{2,}lim/g, "\\lim")
    .replace(/\\{2,}to/g, "\\to");

  // Step 3: Fix common JSON syntax errors
  cleaned = cleaned
    // Fix missing quotes around property names
    .replace(/(\{|\,)\s*([a-zA-Z0-9_]+)\s*\:/g, '$1"$2":')

    // Fix single quotes used instead of double quotes for properties
    .replace(/(\{|\,)\s*\'([a-zA-Z0-9_]+)\'\s*\:/g, '$1"$2":')

    // Fix property names that might be unquoted and causing issues
    .replace(
      /\{([^{]*?)([a-zA-Z0-9_]+)(\s*:)/g,
      function (match, before, propName, after) {
        // Check if the property name is already quoted
        if (!before.trim().endsWith('"') && !before.trim().endsWith("'")) {
          console.log(`Found unquoted property: ${propName}`);
          return `{${before}"${propName}"${after}`;
        }
        return match;
      }
    )

    // Fix single quotes used for string values (but carefully to not break LaTeX)
    .replace(/:\s*\'([^\']*)\'/g, ':"$1"')

    // Fix trailing commas in objects
    .replace(/,\s*\}/g, "}")

    // Fix trailing commas in arrays
    .replace(/,\s*\]/g, "]")

    // Fix missing commas between properties
    .replace(/"\s*\}/g, '"}')
    .replace(/"\s*\{/g, '",{')

    // Fix duplicate commas
    .replace(/,\s*,/g, ",")

    // Fix missing quotes around string values
    .replace(/:\s*([a-zA-Z][a-zA-Z0-9_]*)\s*([,\}])/g, ':"$1"$2')

    // NEW: Streamline LaTeX escaping to use consistent convention
    .replace(/\\\\([a-zA-Z]+)/g, "\\$1")

    // Ensure LaTeX fractions are properly escaped (but not over-escaped)
    .replace(/\\frac/g, "\\frac")
    .replace(/\\\\\\\\frac/g, "\\frac") // Prevent over-escaping

    // Ensure quotes within strings are escaped
    .replace(/"([^"\\]*)"([^"]*")/g, '"$1\\"$2')

    // NEW: Fix closing brace/bracket issues
    .replace(/\}\s*\{/g, "},{")
    .replace(/\]\s*\[/g, "],[")
    .replace(/\}\s*\[/g, "},[")
    .replace(/\]\s*\{/g, "],{");

  // Step 4: Try the jsonrepair library as a final pass
  try {
    cleaned = jsonrepair(cleaned);
    console.log("Standard jsonrepair successful");
  } catch (err) {
    console.warn("Standard jsonrepair failed:", err.message);
    // Continue with our manual fixes
  }

  // Step 5: Validate the resulting JSON structure
  try {
    console.log("JSON before validation:", cleaned);
    console.log("JSON length:", cleaned.length);

    // Log the first few characters where the error might be occurring
    console.log("JSON position 18 context:", cleaned.substring(10, 25));

    const parsed = JSON.parse(cleaned);

    // Ensure it's an array
    if (!Array.isArray(parsed)) {
      console.warn("Repaired JSON is not an array, wrapping it");
      if (typeof parsed === "object") {
        // If it's an object with a quiz property that's an array, use that
        if (parsed.quiz && Array.isArray(parsed.quiz)) {
          cleaned = JSON.stringify(parsed.quiz);
        } else {
          // Otherwise wrap it in an array
          cleaned = "[" + cleaned + "]";
        }
      } else {
        // Default to empty array if all else fails
        cleaned = "[]";
      }
    }

    console.log("JSON validation successful");
    return cleaned;
  } catch (error) {
    console.error(
      "JSON validation failed, performing emergency repairs:",
      error.message
    );

    // NEW: Add more aggressive recovery for specific error patterns
    if (error.message.includes("position")) {
      const position = parseInt(error.message.match(/position (\d+)/)[1]);
      console.error(`Error at position ${position}`);

      // Extract context around the error
      const contextStart = Math.max(0, position - 20);
      const contextEnd = Math.min(cleaned.length, position + 20);
      const errorContext = cleaned.substring(contextStart, contextEnd);
      console.error(`Context: "${errorContext}"`);

      // For specific patterns, attempt targeted fixes
      if (cleaned[position] === "\\" || cleaned[position - 1] === "\\") {
        // Possible backslash escaping issue
        console.log("Detected backslash escaping issue, attempting fix");
        cleaned =
          cleaned.substring(0, position) + cleaned.substring(position + 1);
        console.log("Removed problematic backslash");

        // Try parsing again after fix
        try {
          const parsed = JSON.parse(cleaned);
          if (Array.isArray(parsed)) {
            console.log("Emergency backslash fix successful!");
            return cleaned;
          }
        } catch (err) {
          console.log("Emergency backslash fix failed");
        }
      }
    }

    // Step 6: Emergency repairs - extract any valid question objects
    const questions = [];
    const questionBlockRegex = /\{[^{]*?"question":[^}]*?"type":[^}]*?\}/g;
    const questionBlocks = cleaned.match(questionBlockRegex) || [];

    for (const block of questionBlocks) {
      try {
        // Add surrounding braces if needed
        let fixedBlock = block;
        if (!fixedBlock.startsWith("{")) fixedBlock = "{" + fixedBlock;
        if (!fixedBlock.endsWith("}")) fixedBlock += "}";

        // Add missing quotes around property names
        fixedBlock = fixedBlock.replace(
          /([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g,
          '$1"$2"$3'
        );

        // Try to parse it
        const questionObj = JSON.parse(fixedBlock);
        if (questionObj && questionObj.question) {
          questions.push(questionObj);
        }
      } catch (blockError) {
        console.warn("Failed to parse question block:", blockError.message);
      }
    }

    if (questions.length > 0) {
      console.log(`Emergency repair extracted ${questions.length} questions`);
      return JSON.stringify(questions);
    }

    // If all else fails, return an empty array
    return "[]";
  }
}

/**
 * Function to parse and normalize quiz questions from various formats
 * @param {string|Object} data - The data to parse
 * @returns {Array} - Normalized array of question objects
 */
export function parseQuizQuestions(data) {
  try {
    // If it's a string, try to parse it as JSON
    if (typeof data === "string") {
      try {
        // Log sample of the original JSON string for debugging
        console.log(
          "Original JSON data sample:",
          data.substring(0, 200) + "..."
        );
        console.log("Full JSON length:", data.length);

        // Use our aggressive JSON repair function
        console.log("Using aggressive JSON repair");
        const repairedJson = aggressiveJSONRepair(data);

        // Parse the repaired JSON
        data = JSON.parse(repairedJson);
        console.log(
          `Successfully parsed ${
            Array.isArray(data) ? data.length : 0
          } questions after repair`
        );
      } catch (error) {
        console.error("Fatal error in JSON parsing:", error);
        console.error("Raw data sample:", data.substring(0, 200) + "...");
        // Also log the exact position where the error occurs if it's a SyntaxError
        if (
          error instanceof SyntaxError &&
          error.message.includes("position")
        ) {
          const position = parseInt(error.message.match(/position (\d+)/)[1]);
          const contextStart = Math.max(0, position - 20);
          const contextEnd = Math.min(data.length, position + 20);
          console.error(
            "Error context:",
            data.substring(contextStart, contextEnd)
          );
          console.error(
            "Error position:",
            position,
            "Character at position:",
            data[position]
          );
        }
        return [];
      }
    }

    // Continue with the rest of the function as before
    if (Array.isArray(data)) {
      // Direct array of questions
      return questionsArraySchema.parse(data);
    } else if (data && typeof data === "object" && data.quiz) {
      // Object with 'quiz' property containing questions
      return quizObjectSchema.parse(data);
    } else if (data && typeof data === "object" && data.quizQuestions) {
      // Object with 'quizQuestions' property
      return questionsArraySchema.parse(data.quizQuestions);
    }

    console.warn("Unrecognized quiz data format:", data);
    return [];
  } catch (error) {
    console.error("Error parsing quiz questions:", error);
    if (error.errors) {
      console.error("Validation errors:", error.errors);
    }
    return [];
  }
}
