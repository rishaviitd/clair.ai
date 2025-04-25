import { useState } from "react";
import {
  generateQuizFromNotes,
  generateAdaptiveQuiz,
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
   * @param {boolean} useAdaptive - Whether to use adaptive quiz generation
   * @returns {Promise<Object>} The generated quiz
   */
  const handleGenerateQuiz = async (result, useAdaptive = true) => {
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
        `Starting ${
          useAdaptive ? "adaptive" : "standard"
        } quiz generation for:`,
        result.fileName || "Analysis result"
      );
      console.log("Full result object:", JSON.stringify(result, null, 2));

      // Check if result has necessary data
      if (
        !result ||
        (!result.structuredData && !result.description && !result.markdown)
      ) {
        console.error("Result missing required data for quiz generation");
        throw new Error(
          "Notes data is incomplete or missing. Cannot generate quiz."
        );
      }

      // Check environment variables
      console.log("Checking for API key...");
      if (
        !import.meta.env.VITE_GEMINI_API_KEY ||
        import.meta.env.VITE_GEMINI_API_KEY === "your_gemini_api_key_here"
      ) {
        console.error("API key is missing or using placeholder value");
        throw new Error(
          "Gemini API key is not configured. Please set up your API key."
        );
      }

      // Determine if we should use adaptive generation based on whether there are previous quiz attempts
      const allQuizzes = getStoredQuizzes();
      const hasAttemptedQuizzes = allQuizzes.some(
        (quiz) => quiz.sourceData?.id === result.id && quiz.attempted
      );

      // Use adaptive generation if requested and there are previous quiz attempts
      console.log(
        "Using adaptive generation:",
        useAdaptive && hasAttemptedQuizzes
      );
      let quiz;
      try {
        quiz =
          useAdaptive && hasAttemptedQuizzes
            ? await generateAdaptiveQuiz(result)
            : await generateQuizFromNotes(result);
      } catch (apiError) {
        console.error("API error during quiz generation:", apiError);
        throw new Error(`Error calling Gemini API: ${apiError.message}`);
      }

      console.log("Quiz generation response:", quiz);

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
      return {
        success: false,
        error: errorMsg,
      };
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
        // Calculate scores for each question
        const questionScores = quizResult.quizQuestions.map(
          (question, index) => {
            const isCorrect =
              userAnswers[question.id] === question.correctAnswer;
            return {
              questionNumber: index + 1,
              correct: isCorrect,
              userAnswer: userAnswers[question.id],
              correctAnswer: question.correctAnswer,
              score: isCorrect ? 1 : 0,
            };
          }
        );

        const totalScore = questionScores.reduce((sum, q) => sum + q.score, 0);

        // Update quiz result with completion data
        const updatedQuiz = {
          ...quizResult,
          attempted: true,
          questionScores,
          score: {
            total: quizResult.quizQuestions.length,
            obtained: totalScore,
            percentage: Math.round(
              (totalScore / quizResult.quizQuestions.length) * 100
            ),
          },
        };

        console.log("Saving quiz with score:", updatedQuiz.score);
        console.log("Full quiz object:", updatedQuiz);

        // Update in storage
        const storedQuizzes = getStoredQuizzes();
        console.log("Current stored quizzes:", storedQuizzes);

        const updatedQuizzes = storedQuizzes.map((q) =>
          q.id === updatedQuiz.id ? updatedQuiz : q
        );

        localStorage.setItem(
          "notesQuizResults",
          JSON.stringify(updatedQuizzes)
        );
        console.log("Updated localStorage with new quiz score");

        // Verify it was saved correctly
        const verifyQuizzes = JSON.parse(
          localStorage.getItem("notesQuizResults") || "[]"
        );
        const savedQuiz = verifyQuizzes.find((q) => q.id === updatedQuiz.id);
        console.log("Verified saved quiz:", savedQuiz);

        setQuizResult(updatedQuiz);
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
    // If quiz has been attempted, don't allow another attempt
    if (quiz.attempted) {
      setQuizResult(quiz);
      setQuizCompleted(true);

      // Get the user's previous answers to show in review mode
      const previousAnswers = {};
      quiz.questionScores?.forEach((q) => {
        if (q.userAnswer) {
          const question = quiz.quizQuestions.find(
            (question, index) => index === q.questionNumber - 1
          );
          if (question) {
            previousAnswers[question.id] = q.userAnswer;
          }
        }
      });

      setUserAnswers(previousAnswers);
      return;
    }

    setQuizResult(quiz);
    resetQuiz();
  };

  /**
   * Calculates the current quiz score
   * @returns {Object} Score information
   */
  const getQuizScore = () => {
    if (!quizResult?.quizQuestions)
      return { obtained: 0, total: 0, percentage: 0 };

    const total = quizResult.quizQuestions.length;
    const obtained = Object.keys(userAnswers).filter((qId) => {
      const q = quizResult.quizQuestions.find((q) => q.id === qId);
      return userAnswers[qId] === q?.correctAnswer;
    }).length;

    return {
      obtained,
      total,
      percentage: total ? Math.round((obtained / total) * 100) : 0,
    };
  };

  /**
   * Generates a follow-up adaptive quiz after completing one
   * Only available if a quiz has been completed
   */
  const generateFollowUpQuiz = async () => {
    if (!quizResult || !quizResult.sourceData) {
      setError("No source data available to generate a follow-up quiz");
      return null;
    }

    return handleGenerateQuiz(quizResult.sourceData, true);
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
    setQuizCompleted,
    generateFollowUpQuiz,
  };
};

export default useQuiz;
