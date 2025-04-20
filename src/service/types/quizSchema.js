/**
 * Type definitions for the quiz schema based on Google's Gemini API schema format
 */

import { z } from "zod";

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
 * Function to parse and normalize quiz questions from various formats
 * @param {string|Object} data - The data to parse
 * @returns {Array} - Normalized array of question objects
 */
export function parseQuizQuestions(data) {
  try {
    // If it's a string, try to parse it as JSON
    if (typeof data === "string") {
      try {
        // Handle markdown code blocks
        const codeBlockMatch = data.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        const jsonContent = codeBlockMatch
          ? codeBlockMatch[1].trim()
          : data.trim();

        // Find array boundaries if present
        const arrayStartIndex = jsonContent.indexOf("[");
        const arrayEndIndex = jsonContent.lastIndexOf("]");

        if (arrayStartIndex >= 0 && arrayEndIndex > arrayStartIndex) {
          const arrayText = jsonContent.substring(
            arrayStartIndex,
            arrayEndIndex + 1
          );
          data = JSON.parse(arrayText);
        } else {
          data = JSON.parse(jsonContent);
        }
      } catch (error) {
        console.error("Error parsing JSON string:", error);
        return [];
      }
    }

    // Handle different structures
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
    return [];
  }
}
