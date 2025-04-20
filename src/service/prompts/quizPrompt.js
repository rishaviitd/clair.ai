/**
 * Prompt for the Quiz Generation Service
 */

// Quiz Generation Prompt
export const QUIZ_GENERATION_PROMPT = `Generate a structured quiz based on the provided educational notes. The quiz should test students' understanding of the concepts, formulas, and applications presented in the notes.

I need you to return a valid JSON array of questions. Do not include any explanatory text, markdown code blocks, or additional formatting. The response should start with [ and end with ].

REQUIRED FORMAT:
[
  {
    "id": "q1",
    "type": "mcq",
    "question": "What is the value of X in equation Y?",
    "options": [
      {"id": "a", "text": "Option A text"},
      {"id": "b", "text": "Option B text"},
      {"id": "c", "text": "Option C text"},
      {"id": "d", "text": "Option D text"}
    ],
    "correctAnswer": "b",
    "explanation": "Explanation why option B is correct",
    "topic": "Topic name"
  },
  {
    "id": "q2",
    "type": "subjective",
    "question": "Explain concept Z",
    "sampleAnswer": "Sample answer explaining Z",
    "topic": "Topic name"
  }
]

IMPORTANT: Follow these exact format requirements:
- Use the exact field names shown above
- For multiple choice questions, the "options" field MUST be an array of objects, each with "id" and "text" fields
- The "correctAnswer" field must reference an option id
- Each question must have a unique "id" value
- Include 7 multiple choice and 3 subjective questions

Content guidelines:
- Ensure questions cover all main topics from the notes
- Make questions progressively more challenging
- Include at least 2 questions that test mathematical problem-solving
- For math expressions, use proper LaTeX notation (e.g., $\\frac{1}{2}$ for fractions)

The structured notes data is provided here:`;
