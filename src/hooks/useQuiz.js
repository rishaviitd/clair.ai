import { useState } from "react";
import {
  generateQuizFromNotes,
  getStoredQuizzes,
} from "../service/geminiService";
import { parseQuizQuestions } from "../service/types/quizSchema";

/**
 * Custom hook for managing quiz state and interactions
 * @returns {Object} Quiz state and handlers
 */
const useQuiz = () => {
  const [quizResult, setQuizResult] = useState(null);
  const [selectedResult, setSelectedResult] = useState(null);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [showAnswer, setShowAnswer] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [error, setError] = useState("");

  /**
   * Initializes the quiz hook with any previously saved quizzes
   */
  const initializeWithSavedQuizzes = () => {
    // Check for existing quizzes
    const storedQuizzes = getStoredQuizzes();
    if (storedQuizzes.length > 0) {
      // Find the most recent quiz
      const latestQuiz = storedQuizzes.sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      )[0];

      // If there's a recent quiz, set it as the current one
      if (latestQuiz) {
        setQuizResult(latestQuiz);
      }
    }
  };

  /**
   * Generates a quiz from analysis results
   * @param {Object} result - The analysis result to generate a quiz from
   * @returns {Promise<Object>} The generated quiz
   */
  const handleGenerateQuiz = async (result) => {
    setGeneratingQuiz(true);
    setQuizResult(null);
    setError("");
    setSelectedResult(result);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setShowAnswer(false);
    setQuizCompleted(false);

    try {
      const quiz = await generateQuizFromNotes(result);
      if (quiz.success) {
        // Process the quiz questions if they exist
        if (
          (!quiz.quizQuestions || quiz.quizQuestions.length === 0) &&
          quiz.quiz
        ) {
          try {
            // Use the Zod parseQuizQuestions function
            const parsedQuestions = parseQuizQuestions(quiz.quiz);
            if (parsedQuestions.length > 0) {
              quiz.quizQuestions = parsedQuestions;
            }
          } catch (err) {
            console.warn("Error parsing quiz questions:", err);
          }
        }

        setQuizResult(quiz);
        return quiz;
      } else {
        setError(`Failed to generate quiz: ${quiz.error}`);
        return null;
      }
    } catch (err) {
      setError("An error occurred while generating the quiz");
      console.error(err);
      return null;
    } finally {
      setGeneratingQuiz(false);
    }
  };

  /**
   * Moves to the next question in the quiz
   */
  const handleNextQuestion = () => {
    if (quizResult && quizResult.quizQuestions) {
      if (currentQuestionIndex < quizResult.quizQuestions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
        setShowAnswer(false);
      } else if (!quizCompleted) {
        setQuizCompleted(true);
      }
    }
  };

  /**
   * Moves to the previous question in the quiz
   */
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
      setShowAnswer(false);
    }
  };

  /**
   * Records the user's answer for a question
   * @param {string} questionId - The ID of the question being answered
   * @param {string} answerId - The ID or text of the answer
   */
  const handleAnswerSelect = (questionId, answerId) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: answerId,
    }));
  };

  /**
   * Toggles showing the correct answer
   */
  const toggleShowAnswer = () => {
    setShowAnswer((prev) => !prev);
  };

  /**
   * Resets the quiz state
   */
  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setShowAnswer(false);
    setQuizCompleted(false);
  };

  /**
   * Loads a saved quiz
   * @param {Object} quiz - The saved quiz to load
   */
  const loadQuiz = (quiz) => {
    setQuizResult(quiz);
    resetQuiz();
  };

  /**
   * Calculates the current quiz score
   * @returns {Object} Score information
   */
  const getQuizScore = () => {
    if (!quizResult?.quizQuestions)
      return { correct: 0, total: 0, percentage: 0 };

    const mcqQuestions = quizResult.quizQuestions.filter(
      (q) => q?.type === "mcq"
    );
    const correct = Object.keys(userAnswers).filter((qId) => {
      const q = quizResult.quizQuestions.find((q) => q.id === qId);
      return q?.type === "mcq" && userAnswers[qId] === q?.correctAnswer;
    }).length;

    return {
      correct,
      total: mcqQuestions.length,
      percentage: mcqQuestions.length
        ? Math.round((correct / mcqQuestions.length) * 100)
        : 0,
    };
  };

  return {
    quizResult,
    selectedResult,
    generatingQuiz,
    currentQuestionIndex,
    userAnswers,
    showAnswer,
    quizCompleted,
    error,
    initializeWithSavedQuizzes,
    handleGenerateQuiz,
    handleNextQuestion,
    handlePreviousQuestion,
    handleAnswerSelect,
    toggleShowAnswer,
    resetQuiz,
    loadQuiz,
    getQuizScore,
    setQuizResult,
  };
};

export default useQuiz;
