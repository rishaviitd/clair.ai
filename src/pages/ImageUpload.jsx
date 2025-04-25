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
  FiCode,
} from "react-icons/fi";
import {
  getStoredAnalysisResults,
  generateQuizFromNotes,
  getStoredQuizzes,
  parseQuestions,
  storeAnalysisResult,
} from "../service/geminiService";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { InlineMath, BlockMath } from "react-katex";
import StructuredNotes from "../components/StructuredNotes";
import { useLocation, useNavigate } from "react-router-dom";

// Import components
import Navigation from "../components/Navigation";
import ImageUploader from "../components/ImageUploader";
import ResultsTabView from "../components/ResultsTabView";
import SavedResults from "../components/SavedResults";
import SavedQuizzes from "../components/SavedQuizzes";
import QuizView from "../components/QuizView";
import RawResponseView from "../pages/RawResponseView";

// Import hooks
import useImageUpload from "../hooks/useImageUpload";
import useQuiz from "../hooks/useQuiz";

const TEMP_STATE_KEY = "temp_upload_state";

// Component for displaying the extracted content from the first step
// const ExtractedContent = ({ content }) => {
//   if (!content) return null;

//   return (
//     <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
//       <h3 className="font-semibold text-lg mb-2 text-gray-800">
//         Extracted Content
//       </h3>
//       <div className="bg-white p-4 rounded shadow-sm overflow-auto max-h-96">
//         <pre className="whitespace-pre-wrap font-mono text-sm">{content}</pre>
//       </div>
//     </div>
//   );
// };

const ImageUpload = ({ initialView = "upload" }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [view, setView] = useState(initialView);
  const [savedResults, setSavedResults] = useState([]);
  const [savedQuizzes, setSavedQuizzes] = useState([]);
  const [rawResponse, setRawResponse] = useState(null);

  // Add effect to reset upload section when view changes
  useEffect(() => {
    if (view !== "upload") {
      resetImageUpload();
    }
  }, [view]);

  // Use the custom hooks
  const {
    images,
    uploading,
    results,
    error,
    extractedContent,
    handleImageChange,
    removeImage,
    processBatchWithGemini,
    resetImageUpload,
    setResultsDirectly,
    setError,
    setImagesDirectly,
  } = useImageUpload();

  const { quizResult, selectedResult, generatingQuiz, handleGenerateQuiz } =
    useQuiz();

  // Save state before navigating away
  const saveStateBeforeNavigation = () => {
    const stateToSave = {
      images: images,
      results: results,
      timestamp: Date.now(),
    };
    localStorage.setItem(TEMP_STATE_KEY, JSON.stringify(stateToSave));
  };

  // Restore state when returning
  const restoreState = () => {
    try {
      const savedState = localStorage.getItem(TEMP_STATE_KEY);
      if (savedState) {
        const {
          images: savedImages,
          results: savedResults,
          timestamp,
        } = JSON.parse(savedState);

        // Only restore if the state is less than 5 minutes old
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          setImagesDirectly(savedImages);
          setResultsDirectly(savedResults);
        }

        // Clear the saved state
        localStorage.removeItem(TEMP_STATE_KEY);
      }
    } catch (error) {
      console.error("Error restoring state:", error);
    }
  };

  // Load saved results and quizzes on component mount
  useEffect(() => {
    const loadSavedData = async () => {
      const storedResults = getStoredAnalysisResults();
      const storedQuizzes = getStoredQuizzes();

      setSavedResults(storedResults);
      setSavedQuizzes(storedQuizzes);

      // Check for tab parameter in URL and set view accordingly
      const params = new URLSearchParams(location.search);
      const tabParam = params.get("tab");

      if (tabParam === "saved") {
        setView("saved");
      } else if (tabParam === "upload") {
        setView("upload");
      }

      // Check for quizId in URL parameters
      const quizId = params.get("quizId");

      if (quizId) {
        // Get the quiz from storage and load it
        const quiz = storedQuizzes.find((q) => q.id === quizId);

        if (quiz) {
          // Navigate to quiz page with the quiz ID
          navigate(`/quiz?id=${quizId}`);
        }
      }

      // Restore state if returning from notes view
      if (location.state?.returnFromNotes) {
        restoreState();
      }
    };

    loadSavedData();
  }, [location]);

  // Handler for batch processing with two-step Gemini and updating saved results
  const processBatchWithGeminiAndUpdateSaved = async () => {
    const result = await processBatchWithGemini();
    if (result && result.success) {
      // The result is already stored by processBatchWithGemini internally
      // Just update the local state with the result
      setSavedResults((prev) => [result, ...prev]);
      setResultsDirectly([result]);
    }
  };

  // Handler for generating a quiz and navigating to quiz page
  const handleGenerateQuizAndView = async (result) => {
    try {
      console.log("Starting quiz generation for result:", result);
      const quiz = await handleGenerateQuiz(result);
      console.log("Quiz generation result:", quiz);

      if (quiz && quiz.success) {
        // Store the quiz ID in localStorage to persist between page navigation
        localStorage.setItem("currentQuizId", quiz.id);
        // Navigate to the quiz page
        navigate("/quiz");
      } else {
        // Handle error case
        const errorMessage =
          quiz?.error || "Failed to generate quiz. Please try again.";
        console.error("Quiz generation failed:", errorMessage);

        // Set error to display to the user
        setError(errorMessage);

        // Display alert for immediate feedback
        alert(`Quiz generation failed: ${errorMessage}`);
      }
    } catch (error) {
      console.error("Error in quiz generation:", error);
      const errorMessage =
        error.message || "Unexpected error in quiz generation";
      setError(errorMessage);
      alert(`Quiz generation error: ${errorMessage}`);
    }
  };

  // Handler for loading a saved quiz
  const handleLoadQuiz = (quiz) => {
    // Store the quiz ID in localStorage
    localStorage.setItem("currentQuizId", quiz.id);
    navigate("/quiz");
  };

  // Handler for viewing notes - save state before navigating
  const handleViewNotes = (noteId) => {
    saveStateBeforeNavigation();
    navigate(`/notes/${noteId}`, { state: { fromUpload: true } });
  };

  // Render the current view
  const renderCurrentView = () => {
    switch (view) {
      case "upload":
        return (
          <>
            <ImageUploader
              images={images}
              uploading={uploading}
              error={error}
              handleImageChange={handleImageChange}
              removeImage={removeImage}
              processBatchWithGemini={processBatchWithGeminiAndUpdateSaved}
            />

            {/* {extractedContent && (
              <ExtractedContent content={extractedContent} />
            )} */}

            {results.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold text-lg mb-2 text-green-800">
                  Analysis Results
                </h3>
                <ResultsTabView
                  results={results}
                  onGenerateQuiz={handleGenerateQuizAndView}
                  generatingQuiz={generatingQuiz}
                  onViewNotes={handleViewNotes}
                />
              </div>
            )}
          </>
        );

      case "saved":
        return (
          <SavedResults
            savedResults={savedResults}
            savedQuizzes={savedQuizzes}
            onGenerateQuiz={handleGenerateQuizAndView}
            generatingQuiz={generatingQuiz}
            selectedResult={selectedResult}
            onLoadQuiz={handleLoadQuiz}
          />
        );

      default:
        return <div>Unknown view</div>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 pb-24 md:pb-6">
      <Navigation
        view={view}
        setView={setView}
        savedResultsCount={savedResults.length}
        savedQuizzesCount={0}
      />

      <div className="bg-gray-50 p-4 md:p-6 rounded-lg shadow-sm">
        {renderCurrentView()}
      </div>
    </div>
  );
};

export default ImageUpload;
