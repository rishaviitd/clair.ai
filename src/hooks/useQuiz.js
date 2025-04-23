import { useState } from "react";
import {
  generateQuizFromNotes,
  getStoredQuizzes,
  parseQuestions,
} from "../service/geminiService";

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
      console.log(
        "Starting quiz generation for:",
        result.fileName || "Analysis result"
      );
      const quiz = await generateQuizFromNotes(result);

      if (quiz.success) {
        console.log("Quiz generation successful");

        // Process the quiz questions if they exist
        if (!quiz.quizQuestions || quiz.quizQuestions.length === 0) {
          console.log(
            "No structured questions found, attempting to parse from quiz text"
          );

          if (quiz.quiz) {
            try {
              console.log("Attempting to parse questions from quiz text");
              const parsedQuestions = parseQuestions(quiz.quiz);

              if (parsedQuestions && parsedQuestions.length > 0) {
                console.log(
                  `Successfully parsed ${parsedQuestions.length} questions from quiz text`
                );
                quiz.quizQuestions = parsedQuestions;
              } else {
                console.warn(
                  "Could not parse structured questions from quiz text"
                );
              }
            } catch (parseError) {
              console.warn("Error parsing quiz questions:", parseError.message);
              // Don't throw - we'll display the raw quiz text as fallback
            }
          } else {
            console.warn("No quiz text available");
          }
        }

        // Even if we couldn't parse structured questions, we still set the quiz result
        // The QuizView component will display it as raw text
        setQuizResult(quiz);
        return quiz;
      } else {
        const errorMsg = `Failed to generate quiz: ${quiz.error}`;
        console.error(errorMsg);
        setError(errorMsg);
        return null;
      }
    } catch (err) {
      const errorMsg = `Error generating quiz: ${err.message}`;
      console.error(errorMsg, err);
      setError(errorMsg);
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
