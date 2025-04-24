import React, { useState } from "react";
import {
  FiArrowLeft,
  FiArrowRight,
  FiCheckSquare,
  FiAward,
  FiBookOpen,
} from "react-icons/fi";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import "katex/dist/katex.min.css";

/**
 * Component for displaying and interacting with quizzes
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
      <div className="text-center py-6 md:py-8">
        <div className="w-12 h-12 md:w-16 md:h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3 md:mb-4"></div>
        <p className="text-gray-600">Generating quiz from your notes...</p>
      </div>
    );
  }

  const questions = quizResult.quizQuestions || [];

  // If there are no valid questions, show raw text
  if (questions.length === 0) {
    return (
      <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
          <h3 className="text-lg md:text-xl font-bold text-indigo-700">Quiz</h3>
          <div className="text-sm text-gray-500">
            Based on: {quizResult.sourceData?.fileName || "Analysis"}
          </div>
        </div>

        <div className="mb-4 p-3 md:p-4 bg-yellow-50 border border-yellow-300 rounded-md">
          <p className="text-yellow-800 font-medium">
            The quiz couldn't be displayed in an interactive format. Here's the
            raw quiz content:
          </p>
        </div>

        <div className="mt-4 p-4 md:p-5 bg-white border border-gray-200 rounded-md shadow-sm">
          <ReactMarkdown
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeKatex, rehypeRaw]}
          >
            {quizResult.quiz || "No quiz content available."}
          </ReactMarkdown>
        </div>
      </div>
    );
  }

  // Now render the interactive quiz with structured data
  const currentQuestion = questions[currentQuestionIndex];
  const userAnswer = userAnswers[currentQuestion.id];
  const isCorrect =
    currentQuestion.type === "mcq" &&
    userAnswer === currentQuestion.correctAnswer;
  const quizScore = getQuizScore();

  return (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
        <div className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
          Question {currentQuestionIndex + 1} of {questions.length}
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
        <div className="mt-4 bg-green-50 border border-green-200 rounded-md p-4 md:p-6">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-green-100 rounded-full flex items-center justify-center">
              <FiAward className="text-green-600 text-3xl md:text-4xl" />
            </div>
          </div>
          <h4 className="text-center text-lg md:text-xl font-medium text-green-800 mb-4">
            Quiz Completed!
          </h4>

          <div className="mb-5 text-center">
            <p className="text-green-700 mb-2">Your Score:</p>
            <div className="text-2xl md:text-3xl font-bold">
              {quizScore.obtained} / {quizScore.total} correct
              <span className="ml-2 text-lg md:text-xl">
                ({quizScore.percentage}%)
              </span>
            </div>
          </div>

          {/* Detailed Question Summary */}
          <div className="mt-8 space-y-6">
            <h5 className="text-lg font-medium text-gray-800 mb-4">
              Question Summary
            </h5>
            {questions.map((question, index) => {
              const userAnswer = userAnswers[question.id];
              const isCorrect =
                question.type === "mcq" &&
                userAnswer === question.correctAnswer;

              return (
                <div
                  key={question.id}
                  className="bg-white rounded-lg border p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-sm font-medium text-gray-500">
                      Question {index + 1}
                    </span>
                    {question.type === "mcq" && (
                      <span
                        className={`px-2 py-1 rounded text-sm ${
                          isCorrect
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {isCorrect ? "Correct" : "Incorrect"}
                      </span>
                    )}
                  </div>

                  <div className="mb-4">
                    <ReactMarkdown
                      remarkPlugins={[remarkMath]}
                      rehypePlugins={[rehypeKatex, rehypeRaw]}
                    >
                      {question.question}
                    </ReactMarkdown>
                  </div>

                  <div className="space-y-2">
                    {question.options.map((option) => (
                      <div
                        key={option.id || Math.random()}
                        onClick={() =>
                          !quizCompleted &&
                          handleAnswerSelect(currentQuestion.id, option.id)
                        }
                        className={`p-3 border rounded-md cursor-pointer flex items-center ${
                          userAnswer === option.id
                            ? quizCompleted
                              ? userAnswer === question.correctAnswer
                                ? "bg-green-50 border-green-300"
                                : "bg-red-50 border-red-300"
                              : "bg-indigo-50 border-indigo-300"
                            : quizCompleted &&
                              option.id === question.correctAnswer
                            ? "bg-green-50 border-green-300"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <div className="mr-3 font-medium">
                          {option.id?.toUpperCase() || "?"}
                        </div>
                        <div className="flex-1">
                          <ReactMarkdown
                            remarkPlugins={[remarkMath]}
                            rehypePlugins={[rehypeKatex, rehypeRaw]}
                          >
                            {option.text}
                          </ReactMarkdown>
                        </div>
                        {userAnswer === option.id && !quizCompleted && (
                          <FiCheckSquare className="text-indigo-500" />
                        )}
                        {quizCompleted &&
                          (userAnswer === option.id ||
                            option.id === question.correctAnswer) && (
                            <FiCheckSquare
                              className={
                                option.id === question.correctAnswer
                                  ? "text-green-500"
                                  : "text-red-500"
                              }
                            />
                          )}
                      </div>
                    ))}
                  </div>

                  {quizCompleted && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <h5 className="font-medium text-blue-800 mb-2">
                        Explanation
                      </h5>
                      <div className="text-blue-700">
                        <ReactMarkdown
                          remarkPlugins={[remarkMath]}
                          rehypePlugins={[rehypeKatex, rehypeRaw]}
                        >
                          {question.explanation || "No explanation provided."}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-center mt-8">
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center"
            >
              <FiArrowLeft className="mr-2" /> Back
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 md:space-y-6">
          {/* Question */}
          <div>
            <div className="flex justify-between"></div>
            <h4 className="text-md md:text-lg font-medium mt-1 mb-3 md:mb-4">
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex, rehypeRaw]}
              >
                {currentQuestion.question}
              </ReactMarkdown>
            </h4>

            {/* MCQ Options */}
            <div className="space-y-2 md:space-y-3 mt-3">
              {currentQuestion.options.map((option) => (
                <div
                  key={option.id || Math.random()}
                  onClick={() =>
                    !quizCompleted &&
                    handleAnswerSelect(currentQuestion.id, option.id)
                  }
                  className={`p-3 border rounded-md cursor-pointer flex items-center ${
                    userAnswer === option.id
                      ? quizCompleted
                        ? userAnswer === currentQuestion.correctAnswer
                          ? "bg-green-50 border-green-300"
                          : "bg-red-50 border-red-300"
                        : "bg-indigo-50 border-indigo-300"
                      : quizCompleted &&
                        option.id === currentQuestion.correctAnswer
                      ? "bg-green-50 border-green-300"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="mr-3 font-medium">
                    {option.id?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1">
                    <ReactMarkdown
                      remarkPlugins={[remarkMath]}
                      rehypePlugins={[rehypeKatex, rehypeRaw]}
                    >
                      {option.text}
                    </ReactMarkdown>
                  </div>
                  {userAnswer === option.id && !quizCompleted && (
                    <FiCheckSquare className="text-indigo-500" />
                  )}
                  {quizCompleted &&
                    (userAnswer === option.id ||
                      option.id === currentQuestion.correctAnswer) && (
                      <FiCheckSquare
                        className={
                          option.id === currentQuestion.correctAnswer
                            ? "text-green-500"
                            : "text-red-500"
                        }
                      />
                    )}
                </div>
              ))}
            </div>

            {/* Explanation / Sample Answer */}
            {showAnswer && (
              <div className="mt-4 p-3 md:p-4 bg-blue-50 border border-blue-200 rounded-md">
                <h5 className="font-medium text-blue-800 mb-2">Explanation</h5>
                <div className="text-blue-700 text-sm md:text-base">
                  <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex, rehypeRaw]}
                  >
                    {currentQuestion.explanation || "No explanation provided."}
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
              className={`px-2 py-1.5 md:px-3 flex items-center rounded-md ${
                currentQuestionIndex === 0
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
              }`}
            >
              <FiArrowLeft className="mr-1" />
              <span className="hidden sm:inline">Previous</span>
              <span className="sm:hidden">Prev</span>
            </button>

            <button
              onClick={handleNextQuestion}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center"
            >
              {currentQuestionIndex < questions.length - 1 ? (
                <>
                  <span className="hidden sm:inline">Next</span>
                  <span className="sm:hidden">Next</span>
                  <FiArrowRight className="ml-1" />
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
};

export default QuizView;
