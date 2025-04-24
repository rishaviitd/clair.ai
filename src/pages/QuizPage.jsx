import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import QuizView from "../components/QuizView";
import useQuiz from "../hooks/useQuiz";
import { getStoredQuizzes } from "../service/geminiService";

const QuizPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
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
    loadQuiz,
  } = useQuiz();

  // Load quiz from URL parameter or localStorage if available
  useEffect(() => {
    if (!quizResult) {
      // First try to get quiz ID from URL
      const params = new URLSearchParams(location.search);
      const urlQuizId = params.get("id");

      // Then try to get quiz ID from localStorage
      const storedQuizId = localStorage.getItem("currentQuizId");

      const quizId = urlQuizId || storedQuizId;

      if (quizId) {
        const storedQuizzes = getStoredQuizzes();
        const quiz = storedQuizzes.find((q) => q.id === quizId);

        if (quiz) {
          loadQuiz(quiz);
          // Clear the stored quiz ID after loading
          localStorage.removeItem("currentQuizId");
        }
      }
    }
  }, [location, quizResult, loadQuiz]);

  const handleBack = () => {
    navigate("/?tab=saved");
  };

  // If no quiz is loaded, show a message
  if (!quizResult) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-8">
          <p className="text-gray-600">No quiz is currently loaded.</p>
          <button
            onClick={handleBack}
            className="mt-4 inline-flex items-center text-indigo-600 hover:text-indigo-800"
          >
            <FiArrowLeft className="mr-2" /> Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6 flex items-center">
        <button
          onClick={handleBack}
          className="inline-flex items-center text-indigo-600 hover:text-indigo-800"
        >
          <FiArrowLeft className="mr-2" /> Back
        </button>
      </div>

      <QuizView
        quizResult={quizResult}
        currentQuestionIndex={currentQuestionIndex}
        userAnswers={userAnswers}
        showAnswer={showAnswer}
        quizCompleted={quizCompleted}
        handleNextQuestion={handleNextQuestion}
        handlePreviousQuestion={handlePreviousQuestion}
        handleAnswerSelect={handleAnswerSelect}
        toggleShowAnswer={toggleShowAnswer}
        resetQuiz={resetQuiz}
        getQuizScore={getQuizScore}
      />
    </div>
  );
};

export default QuizPage;
