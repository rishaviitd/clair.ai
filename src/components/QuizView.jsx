import React, { useState, useEffect } from "react";
import { FiArrowLeft, FiArrowRight, FiCheckSquare } from "react-icons/fi";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { prepareLatexContent } from "../utils/LatexUtils";
import { jsonrepair } from "jsonrepair";

/**
 * Emergency JSON repair function specifically for quiz data
 * Handles the common error patterns seen in Gemini outputs
 */
const emergencyRepairQuizJson = (jsonText) => {
  if (!jsonText) return null;

  try {
    // First try to parse it directly (maybe it's already valid)
    return JSON.parse(jsonText);
  } catch (e) {
    console.log("Initial JSON parse failed, attempting repairs:", e.message);

    // Step 1: Remove any markdown code blocks and extract just the JSON
    let cleaned = jsonText;
    const codeBlockMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      cleaned = codeBlockMatch[1].trim();
    }

    // Step 2: Ensure we're working with an array that starts with [ and ends with ]
    if (cleaned.includes("[") && cleaned.includes("]")) {
      const startIdx = cleaned.indexOf("[");
      const endIdx = cleaned.lastIndexOf("]") + 1;
      if (startIdx >= 0 && endIdx > startIdx) {
        cleaned = cleaned.substring(startIdx, endIdx);
      }
    }

    // Step 3: Fix the common backslashed property names issue (the main problem)
    // This regex specifically targets the pattern: "id\": and \"type":
    cleaned = cleaned
      // Fix property name with escaped quote: "id\":
      .replace(/"([a-zA-Z0-9_]+)\\"/g, '"$1"')

      // Fix property value with escaped quote: \"value"
      .replace(/\\+"([^"]+)"/g, '"$1"')

      // General cleanup of inconsistent escaping
      .replace(/\\+"/g, '"')
      .replace(/"\s*\\/g, '"')

      // Fix options array with escaped brackets
      .replace(/\\+\[/g, "[")
      .replace(/\\+\]/g, "]")

      // Fix missing colons after property names
      .replace(/"([a-zA-Z0-9_]+)"\s+"/g, '"$1":"')

      // Fix missing quotes around property names
      .replace(/\{([^{]*?)([a-zA-Z0-9_]+)(\s*:)/g, '{$1"$2"$3')

      // Fix trailing commas
      .replace(/,\s*\}/g, "}")
      .replace(/,\s*\]/g, "]");

    // Step 4: Try to parse with standard jsonrepair library
    try {
      const repaired = jsonrepair(cleaned);
      return JSON.parse(repaired);
    } catch (repairError) {
      console.error("JSON repair failed:", repairError.message);

      // Step 5: Last resort - try to extract individual questions
      const questions = [];
      const questionRegex = /\{[^{]*?"question":[^}]*?\}/g;
      const matches = cleaned.match(questionRegex) || [];

      for (const match of matches) {
        try {
          // Add very aggressive fixing for each individual question
          let fixedMatch = match
            .replace(/\\"/g, '"') // Replace all \" with "
            .replace(/"\s*([a-zA-Z0-9_]+)\s*":/g, '"$1":') // Fix "prop ":
            .replace(/:\s*"([^"]+?)\\"/g, ':"$1"') // Fix :"value\"
            .replace(/([{,])\s*([a-zA-Z0-9_]+):/g, '$1"$2":'); // Add quotes around property names

          // Ensure it ends with a closing brace
          if (!fixedMatch.endsWith("}")) {
            fixedMatch += "}";
          }

          const parsedQuestion = JSON.parse(fixedMatch);
          if (parsedQuestion.question) {
            questions.push(parsedQuestion);
          }
        } catch (e) {
          console.warn("Failed to parse individual question:", e.message);
        }
      }

      if (questions.length > 0) {
        console.log(`Emergency repair extracted ${questions.length} questions`);
        return questions;
      }

      // If all else fails
      return null;
    }
  }
};

/**
 * Prepares math content from quiz for rendering
 * This function ensures proper formatting of math expressions
 */
const prepareMathContent = (text) => {
  if (!text) return "";

  let processed = text;

  // First, check if text already has math delimiters
  const hasMathDelimiters = text.includes("$");

  if (!hasMathDelimiters) {
    // If no math delimiters are found, no processing needed
    return text;
  }

  // Fix common issues with math delimiters
  processed = processed
    // Ensure spaces around block math
    .replace(/\$\$(.*?)\$\$/g, "\n\n$$\n$1\n$$\n\n")

    // Fix common escaping issues with backslashes in math
    .replace(/\\\\/g, "\\")

    // Fix fraction commands
    .replace(/\\frac\s*\{([^}]*)\}\s*\{([^}]*)\}/g, "\\frac{$1}{$2}")

    // Ensure delimiters have proper spacing
    .replace(/(\w)\$/g, "$1 $")
    .replace(/\$(\w)/g, "$ $1");

  return processed;
};

/**
 * Component for displaying and interacting with quizzes
 *
 * @param {Object} props
 * @param {Object} props.quizResult - Quiz result object
 * @param {number} props.currentQuestionIndex - Current question index
 * @param {Object} props.userAnswers - User's answers
 * @param {boolean} props.showAnswer - Whether to show the answer
 * @param {boolean} props.quizCompleted - Whether the quiz is completed
 * @param {Function} props.handleNextQuestion - Function to go to next question
 * @param {Function} props.handlePreviousQuestion - Function to go to previous question
 * @param {Function} props.handleAnswerSelect - Function to handle answer selection
 * @param {Function} props.toggleShowAnswer - Function to toggle showing the answer
 * @param {Function} props.resetQuiz - Function to reset the quiz
 * @param {Function} props.getQuizScore - Function to get quiz score
 */
const QuizView = ({
  quizResult,
  currentQuestionIndex,
  userAnswers,
  showAnswer,
  quizCompleted,
  handleNextQuestion,
  handlePreviousQuestion,
  handleAnswerSelect,
  toggleShowAnswer,
  resetQuiz,
  getQuizScore,
}) => {
  const [debugMode, setDebugMode] = useState(false);
  const [repairedQuestions, setRepairedQuestions] = useState(null);

  // Try to repair JSON on component mount or when quizResult changes
  useEffect(() => {
    if (
      quizResult &&
      quizResult.quiz &&
      (!quizResult.quizQuestions || quizResult.quizQuestions.length === 0)
    ) {
      console.log("Attempting emergency JSON repair for quiz");
      const repaired = emergencyRepairQuizJson(quizResult.quiz);
      if (repaired && Array.isArray(repaired) && repaired.length > 0) {
        console.log(`Successfully repaired ${repaired.length} questions`);
        setRepairedQuestions(repaired);
      }
    }
  }, [quizResult]);

  // If quiz is still loading
  if (!quizResult) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Generating quiz from your notes...</p>
      </div>
    );
  }

  // Use repaired questions if available, otherwise use the original
  const questions = repairedQuestions || quizResult.quizQuestions;

  // Verify that the questions are valid
  const hasValidQuizQuestions =
    questions && Array.isArray(questions) && questions.length > 0;

  // If quiz doesn't have structured questions, show raw text
  if (!hasValidQuizQuestions) {
    // Try to extract raw JSON from the quiz if available
    let rawJsonContent = null;
    if (quizResult.quiz) {
      const jsonBlockMatch = quizResult.quiz.match(
        /```(?:json)?\s*([\s\S]*?)\s*```/
      );
      if (jsonBlockMatch) {
        rawJsonContent = jsonBlockMatch[1].trim();
      } else if (
        quizResult.quiz.includes("[") &&
        quizResult.quiz.includes("]")
      ) {
        // Try to extract just the JSON array
        const startIdx = quizResult.quiz.indexOf("[");
        const endIdx = quizResult.quiz.lastIndexOf("]") + 1;
        if (startIdx >= 0 && endIdx > startIdx) {
          rawJsonContent = quizResult.quiz.substring(startIdx, endIdx);
        }
      }
    }

    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-indigo-700">Quiz</h3>
          <div className="text-sm text-gray-500">
            Based on: {quizResult.sourceData?.fileName || "Analysis"}
          </div>
        </div>

        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-300 rounded-md">
          <p className="text-yellow-800 font-medium">
            The quiz couldn't be displayed in an interactive format. Here's the
            raw quiz content:
          </p>

          <div className="mt-3 flex space-x-2">
            <button
              onClick={() => setDebugMode(!debugMode)}
              className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              {debugMode ? "Hide Debug Info" : "Show Debug Info"}
            </button>

            <button
              onClick={() => resetQuiz()}
              className="px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Reset Quiz
            </button>
          </div>

          {debugMode && (
            <div className="mt-3 p-3 bg-gray-100 border border-gray-300 rounded text-xs overflow-auto">
              <h5 className="font-medium mb-1">Raw Response Data:</h5>
              <pre className="overflow-auto max-h-60 bg-gray-50 p-2 rounded">
                {JSON.stringify(quizResult, null, 2)}
              </pre>

              {rawJsonContent && (
                <>
                  <h5 className="font-medium mb-1 mt-3">Raw JSON Content:</h5>
                  <pre className="overflow-auto max-h-60 bg-gray-50 p-2 rounded">
                    {rawJsonContent}
                  </pre>
                  <div className="mt-2">
                    <button
                      onClick={() => {
                        try {
                          const repaired = jsonrepair(rawJsonContent);
                          alert(
                            "JSON repaired successfully! You can copy it from the text area below."
                          );
                          navigator.clipboard.writeText(repaired).then(() => {
                            alert("Repaired JSON copied to clipboard!");
                          });
                        } catch (err) {
                          alert("Failed to repair JSON: " + err.message);
                        }
                      }}
                      className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Try to repair and copy JSON
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        <div className="mt-4 p-5 bg-white border border-gray-200 rounded-md shadow-sm">
          {quizResult.quiz ? (
            <ReactMarkdown
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex]}
            >
              {quizResult.quiz || "No quiz content available."}
            </ReactMarkdown>
          ) : (
            <div className="p-4 text-center text-gray-700">
              <p>
                No quiz content could be generated. Please try again with a
                different analysis result.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  try {
    // Attempt to render the interactive quiz using structured data
    const currentQuestion = questions[currentQuestionIndex] || questions[0];

    // Safety check for current question
    if (!currentQuestion) {
      console.error("No currentQuestion available");
      return (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="p-4 bg-red-50 border border-red-300 rounded-md">
            <p className="text-red-700">
              Error: Could not load quiz question data.
            </p>
            <button
              onClick={() => resetQuiz()}
              className="mt-4 px-3 py-1 bg-blue-600 text-white rounded"
            >
              Reset Quiz
            </button>
          </div>
        </div>
      );
    }

    const userAnswer = userAnswers[currentQuestion.id];
    const isCorrect =
      currentQuestion.type === "mcq" &&
      userAnswer === currentQuestion.correctAnswer;
    const hasAnswered = userAnswer !== undefined;
    const quizScore = getQuizScore();

    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-indigo-700">
            Quiz: {quizResult.sourceData?.fileName || "Notes Analysis"}
          </h3>
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium text-gray-600">
              Question {currentQuestionIndex + 1} of {questions.length}
            </div>
            <button
              onClick={() => setDebugMode(!debugMode)}
              className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              {debugMode ? "Hide Raw Data" : "Show Raw Data"}
            </button>
          </div>
        </div>

        {debugMode && (
          <div className="mt-2 mb-4 p-3 bg-gray-100 border border-gray-300 rounded-md">
            <h5 className="text-sm font-medium text-gray-700 mb-1">
              Question Data:
            </h5>
            <pre className="text-xs overflow-auto max-h-60 bg-gray-50 p-2 rounded">
              {JSON.stringify(currentQuestion, null, 2)}
            </pre>
          </div>
        )}

        {quizCompleted ? (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-md p-6">
            <h4 className="text-lg font-medium text-green-800 mb-4">
              Quiz Completed!
            </h4>

            <div className="mb-4">
              <p className="text-green-700 mb-2">Your Score:</p>
              <div className="text-2xl font-bold">
                {quizScore.correct} / {quizScore.total} correct
                <span className="ml-2 text-lg">({quizScore.percentage}%)</span>
              </div>
            </div>

            <button
              onClick={() => resetQuiz()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Review Questions
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Question */}
            <div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-500">
                  {currentQuestion.topic || "General"}
                </span>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                  {currentQuestion.type === "mcq"
                    ? "Multiple Choice"
                    : "Subjective"}
                </span>
              </div>
              <h4 className="text-lg font-medium mt-1 mb-4 math-content">
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                >
                  {prepareMathContent(currentQuestion.question)}
                </ReactMarkdown>
              </h4>

              {/* MCQ Options */}
              {currentQuestion.type === "mcq" &&
                currentQuestion.options &&
                Array.isArray(currentQuestion.options) && (
                  <div className="space-y-3 mt-3">
                    {currentQuestion.options.length === 0 ? (
                      <div className="p-3 border border-yellow-300 bg-yellow-50 rounded-md">
                        <p className="text-yellow-700">
                          This question has no options available.
                        </p>
                      </div>
                    ) : (
                      currentQuestion.options.map((option) => (
                        <div
                          key={option.id || Math.random()}
                          onClick={() =>
                            !showAnswer &&
                            handleAnswerSelect(currentQuestion.id, option.id)
                          }
                          className={`p-3 border rounded-md cursor-pointer flex items-center ${
                            userAnswer === option.id
                              ? isCorrect
                                ? "bg-green-50 border-green-300"
                                : showAnswer
                                ? "bg-red-50 border-red-300"
                                : "bg-indigo-50 border-indigo-300"
                              : showAnswer &&
                                option.id === currentQuestion.correctAnswer
                              ? "bg-green-50 border-green-300"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          <div className="mr-3 font-medium">
                            {option.id?.toUpperCase() || "?"}
                          </div>
                          <div className="flex-1 math-content">
                            <ReactMarkdown
                              remarkPlugins={[remarkMath]}
                              rehypePlugins={[rehypeKatex]}
                            >
                              {prepareMathContent(
                                option.text || "No option text available"
                              )}
                            </ReactMarkdown>
                          </div>
                          {userAnswer === option.id && (
                            <FiCheckSquare
                              className={
                                isCorrect ? "text-green-500" : "text-indigo-500"
                              }
                            />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

              {/* Subjective Question */}
              {currentQuestion.type === "subjective" && (
                <div className="mt-3">
                  <textarea
                    placeholder="Write your answer here..."
                    value={userAnswer || ""}
                    onChange={(e) =>
                      handleAnswerSelect(currentQuestion.id, e.target.value)
                    }
                    disabled={showAnswer}
                    className="w-full p-3 border rounded-md min-h-32"
                  />
                </div>
              )}

              {/* Explanation / Sample Answer */}
              {showAnswer && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <h5 className="font-medium text-blue-800 mb-2">
                    {currentQuestion.type === "mcq"
                      ? "Explanation"
                      : "Sample Answer"}
                  </h5>
                  <div className="text-blue-700 math-content">
                    <ReactMarkdown
                      remarkPlugins={[remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                    >
                      {prepareMathContent(
                        currentQuestion.type === "mcq"
                          ? currentQuestion.explanation
                          : currentQuestion.sampleAnswer
                      )}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <button
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
                className={`px-3 py-1.5 flex items-center ${
                  currentQuestionIndex === 0
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-indigo-600 hover:text-indigo-800"
                }`}
              >
                <FiArrowLeft className="mr-1" /> Previous
              </button>

              <button
                onClick={toggleShowAnswer}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                {showAnswer ? "Hide Answer" : "Show Answer"}
              </button>

              <button
                onClick={handleNextQuestion}
                className="px-3 py-1.5 text-indigo-600 hover:text-indigo-800 flex items-center"
              >
                {currentQuestionIndex < questions.length - 1 ? (
                  <>
                    Next <FiArrowRight className="ml-1" />
                  </>
                ) : (
                  "Finish Quiz"
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error("Error rendering quiz:", error);
    // Fallback to raw text display
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-indigo-700">Quiz</h3>
          <div className="text-sm text-gray-500">
            Based on: {quizResult.sourceData?.fileName || "Analysis"}
          </div>
        </div>

        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md mb-4">
          <p className="text-yellow-700">
            There was an error displaying the interactive quiz ({error.message}
            ). Showing raw content instead.
          </p>
        </div>

        <div className="mt-4 p-5 bg-white border border-gray-200 rounded-md shadow-sm">
          <ReactMarkdown
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeKatex]}
          >
            {quizResult.quiz || "No quiz content available."}
          </ReactMarkdown>
        </div>
      </div>
    );
  }
};

export default QuizView;
