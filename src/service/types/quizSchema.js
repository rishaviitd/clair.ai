/**
 * Type definitions for the quiz schema based on Google's Gemini API schema format
 */

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
