import React, { useState } from "react";
import { FiArrowLeft, FiArrowRight, FiCheckSquare } from "react-icons/fi";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { prepareLatexContent } from "../utils/LatexUtils";

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

  // If quiz is still loading
  if (!quizResult) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Generating quiz from your notes...</p>
      </div>
    );
  }

  // Verify that the questions are valid
  const hasValidQuizQuestions =
    quizResult.quizQuestions &&
    Array.isArray(quizResult.quizQuestions) &&
    quizResult.quizQuestions.length > 0;

  // If quiz doesn't have structured questions, show raw text
  if (!hasValidQuizQuestions) {
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

          <div className="mt-3">
            <button
              onClick={() => setDebugMode(!debugMode)}
              className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              {debugMode ? "Hide Debug Info" : "Show Debug Info"}
            </button>
          </div>

          {debugMode && (
            <div className="mt-3 p-3 bg-gray-100 border border-gray-300 rounded text-xs overflow-auto">
              <h5 className="font-medium mb-1">Raw Response Data:</h5>
              <pre className="overflow-auto max-h-60 bg-gray-50 p-2 rounded">
                {JSON.stringify(quizResult, null, 2)}
              </pre>
            </div>
          )}
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

  try {
    // Attempt to render the interactive quiz using structured data
    const questions = quizResult.quizQuestions;
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
                  {prepareLatexContent(currentQuestion.question)}
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
                              {prepareLatexContent(
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
                      {prepareLatexContent(
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
