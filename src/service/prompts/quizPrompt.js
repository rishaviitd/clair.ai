/**
 * Prompt template for generating quizzes from notes
 * This prompt is used to generate a structured quiz with multiple-choice and subjective questions
 */

// Quiz Generation Prompt
export const QUIZ_GENERATION_PROMPT = `Generate a quiz with 10 MCQ questions based on the notes provided.

The notes might be in Markdown format with proper headings, lists, and math formulas. Please analyze the content carefully to identify key concepts, definitions, formulas, and examples from which to create questions.

IMPORTANT FORMATTING INSTRUCTIONS:

1. Return your response as JSON - a plain array of question objects.
2. DO NOT wrap the JSON in markdown code blocks (no \`\`\`json or \`\`\` tags).
3. DO NOT include any text before or after the JSON.
4. Use proper markdown formatting in questions, options, and explanations.
5. For math expressions, use LaTeX notation between single dollar signs for inline math: $x^2$ or double dollar signs for block math: $$\\frac{dy}{dx}$$

Each question object in the array should have:
- "id": a unique identifier (e.g., "q1", "q2", etc.)
- "question": the question text (can include markdown and LaTeX math)
- For MCQ questions, include:
  - "options": an array of objects, each with "id" (a, b, c, d) and "text" (can include markdown and LaTeX math)
  - "correctAnswer": the id of the correct option
  - "explanation": why the answer is correct (can include markdown and LaTeX math)


Here are some of the example of the expected JSON structure with proper markdown and LaTeX formatting:

[
  {
      "id": "q1",
      "question": "What is the radian equivalent of $60^\\circ$?",
      "options": [
        {"id": "a", "text": "$\\frac{\\pi}{6}$"},
        {"id": "b", "text": "$\\frac{\\pi}{4}$"},
        {"id": "c", "text": "$\\frac{\\pi}{3}$"},
        {"id": "d", "text": "$\\frac{\\pi}{2}$"}
      ],
      "correctAnswer": "c",
      "explanation": "To convert degrees to radians, we multiply by $\\frac{\\pi}{180}$. So, $60^\\circ \\times \\frac{\\pi}{180} = \\frac{\\pi}{3}$."
    }
]

Now, based on the following notes, create 10 questions:

`;
