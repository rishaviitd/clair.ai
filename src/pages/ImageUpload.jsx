import React, { useState, useEffect } from "react";
import {
  FiUpload,
  FiImage,
  FiCheckCircle,
  FiX,
  FiBookOpen,
  FiEdit,
  FiDatabase,
  FiList,
  FiArrowRight,
  FiArrowLeft,
  FiCheckSquare,
} from "react-icons/fi";
import {
  getStoredAnalysisResults,
  generateQuizFromNotes,
  getStoredQuizzes,
} from "../service/geminiService";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { InlineMath, BlockMath } from "react-katex";
import StructuredNotes from "../components/StructuredNotes";
import { parseQuizQuestions } from "../service/types/quizSchema";

// Import components
import Navigation from "../components/Navigation";
import ImageUploader from "../components/ImageUploader";
import ResultsTabView from "../components/ResultsTabView";
import SavedResults from "../components/SavedResults";
import SavedQuizzes from "../components/SavedQuizzes";
import QuizView from "../components/QuizView";

// Import hooks
import useImageUpload from "../hooks/useImageUpload";
import useQuiz from "../hooks/useQuiz";

// Component for displaying the extracted content from the first step
const ExtractedContent = ({ content }) => {
  if (!content) return null;

  return (
    <div className="mt-6 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
      <h3 className="font-semibold text-lg mb-2 text-yellow-800">
        Initial Extraction (Step 1)
      </h3>
      <div className="bg-white p-4 rounded shadow-sm overflow-auto max-h-96">
        <ReactMarkdown
          remarkPlugins={[remarkMath]}
          rehypePlugins={[rehypeKatex]}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
};

const ImageUpload = () => {
  const [view, setView] = useState("upload");
  const [savedResults, setSavedResults] = useState([]);

  // Use the custom hooks
  const {
    images,
    uploading,
    results,
    error,
    extractedContent,
    handleImageChange,
    removeImage,
    processWithGemini,
    setResultsDirectly,
    setError,
  } = useImageUpload();

  const {
    quizResult,
    selectedResult,
    generatingQuiz,
    currentQuestionIndex,
    userAnswers,
    showAnswer,
    quizCompleted,
    initializeWithSavedQuizzes,
    handleGenerateQuiz,
    handleNextQuestion,
    handlePreviousQuestion,
    handleAnswerSelect,
    toggleShowAnswer,
    resetQuiz,
    loadQuiz,
    getQuizScore,
  } = useQuiz();

  // Load saved results and quizzes on component mount
  useEffect(() => {
    const loadSavedData = () => {
      const storedResults = getStoredAnalysisResults();
      setSavedResults(storedResults);

      // Initialize quizzes from storage
      initializeWithSavedQuizzes();
    };

    loadSavedData();
  }, []);

  // Handler for processing images with two-step Gemini and updating saved results
  const processWithGeminiAndUpdateSaved = async () => {
    const newResults = await processWithGemini();
    if (newResults && newResults.length > 0) {
      // Update saved results with new results
      setSavedResults((prev) => [...newResults, ...prev]);
    }
  };

  // Handler for generating a quiz and switching to quiz view
  const handleGenerateQuizAndView = async (result) => {
    const quiz = await handleGenerateQuiz(result);
    if (quiz) {
      setView("quiz");
    }
  };

  // Handler for viewing a saved result
  const handleViewSavedResult = (result) => {
    setResultsDirectly([result]);
    setView("upload");
  };

  // Handler for loading a saved quiz
  const handleLoadQuiz = (quiz) => {
    loadQuiz(quiz);
    setView("quiz");
  };

  // Render the current view
  const renderCurrentView = () => {
    switch (view) {
      case "upload":
        return (
          <>
            <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h2 className="font-bold text-xl mb-2 text-blue-800">
                Notes Processing
              </h2>
              <p className="text-blue-700">
                This application uses a two-step approach:
              </p>
              <ol className="list-decimal ml-5 mt-2 text-blue-700">
                <li className="mb-1">
                  Extract raw content from your notes image
                </li>
                <li>
                  Structure the extracted content into organized topics and
                  concepts
                </li>
              </ol>
            </div>

            <ImageUploader
              images={images}
              uploading={uploading}
              error={error}
              handleImageChange={handleImageChange}
              removeImage={removeImage}
              processWithGemini={processWithGeminiAndUpdateSaved}
            />

            {extractedContent && (
              <ExtractedContent content={extractedContent} />
            )}

            {results.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold text-lg mb-2 text-green-800">
                  Structured Result (Step 2)
                </h3>
                <ResultsTabView
                  results={results}
                  onGenerateQuiz={handleGenerateQuizAndView}
                />
              </div>
            )}
          </>
        );

      case "saved":
        return (
          <SavedResults
            savedResults={savedResults}
            onViewResult={handleViewSavedResult}
            onGenerateQuiz={handleGenerateQuizAndView}
            generatingQuiz={generatingQuiz}
            selectedResult={selectedResult}
          />
        );

      case "quizzes":
        return (
          <SavedQuizzes
            savedQuizzes={getStoredQuizzes()}
            onLoadQuiz={handleLoadQuiz}
          />
        );

      case "quiz":
        return (
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
        );

      default:
        return <div>Unknown view</div>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Navigation
        view={view}
        setView={setView}
        savedResultsCount={savedResults.length}
        savedQuizzesCount={getStoredQuizzes().length}
        quizResult={quizResult}
      />

      {renderCurrentView()}
    </div>
  );
};

export default ImageUpload;
