/**
 * Prompt template for generating quizzes from notes
 * This prompt is used to generate a structured quiz with multiple-choice and subjective questions
 */

// Quiz Generation Prompt
export const QUIZ_GENERATION_PROMPT = `Generate a quiz with 10 questions (8 multiple choice, 2 subjective) based on the notes provided.

The notes might be in Markdown format with proper headings, lists, and math formulas. Please analyze the content carefully to identify key concepts, definitions, formulas, and examples from which to create questions.

IMPORTANT FORMATTING INSTRUCTIONS:

1. Return your response as JSON - a plain array of question objects.
2. DO NOT wrap the JSON in markdown code blocks (no \`\`\`json or \`\`\` tags).
3. DO NOT include any text before or after the JSON.

Each question object in the array should have:
- "id": a unique identifier (e.g., "q1", "q2", etc.)
- "type": either "mcq" or "subjective"
- "question": the question text
- For MCQ questions, include:
  - "options": an array of objects, each with "id" (a, b, c, d) and "text"
  - "correctAnswer": the id of the correct option
  - "explanation": why the answer is correct
- For subjective questions, include:
  - "sampleAnswer": a model answer

Example of the expected JSON structure (but with your own questions):

[
  {
    "id": "q1",
    "type": "mcq",
    "question": "What is the derivative of x²?",
    "options": [
      {"id": "a", "text": "x"},
      {"id": "b", "text": "2x"},
      {"id": "c", "text": "x²"},
      {"id": "d", "text": "2"}
    ],
    "correctAnswer": "b",
    "explanation": "The derivative of x² is 2x."
  },
  {
    "id": "q2",
    "type": "subjective",
    "question": "Explain the concept of limits in calculus.",
    "sampleAnswer": "A limit describes the value a function approaches as the input approaches a certain value."
  }
]

Now, based on the following notes, create 10 questions:

`;
