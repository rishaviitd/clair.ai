/**
 * Prompt for the Quiz Generation Service
 */

// Quiz Generation Prompt
export const QUIZ_GENERATION_PROMPT = `Generate a quiz with 10 questions (8 multiple choice, 2 subjective) based on the notes.

Return a VALID JSON array of questions. DO NOT include any backslashes before quotes in property names or values.

CORRECT JSON FORMAT (follow this exactly):
[
  {
    "id": "q1",
    "type": "mcq",
    "question": "What is the average rate of change?",
    "options": [
      {"id": "a", "text": "The change in y divided by the change in x"},
      {"id": "b", "text": "The slope of a secant line"},
      {"id": "c", "text": "The instantaneous rate of change"},
      {"id": "d", "text": "The area under a curve"}
    ],
    "correctAnswer": "b",
    "explanation": "The average rate of change is represented by the slope of the secant line connecting two points on a curve.",
    "topic": "Differentiation"
  },
  {
    "id": "q2",
    "type": "subjective",
    "question": "Explain the concept of average rate of change with respect to a curve.",
    "sampleAnswer": "The average rate of change between two points on a curve is the slope of the secant line connecting those points. It represents the average change in the dependent variable (y) per unit change in the independent variable (x) over that interval.",
    "topic": "Differentiation"
  }
]

IMPORTANT - DO NOT INCLUDE BACKSLASHES (\) BEFORE QUOTES IN JSON:
✓ CORRECT: "id": "q1"
✗ WRONG: "id\": "q1"
✗ WRONG: \"id": "q1\"

For MATH FORMULAS in questions/answers, use standard markdown notation:
* Inline math: $formula$ (example: $x^2 + y^2 = z^2$)
* Block math: $$formula$$ (example: $$\frac{dy}{dx}$$)

The structured notes data is provided here:`;
