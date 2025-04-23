import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import StructuredNotes from "../components/StructuredNotes";
import {
  getStoredAnalysisResults,
  generateQuizFromNotes,
  storeQuizResult,
} from "../service/geminiService";

const NotesView = () => {
  const { noteId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [noteData, setNoteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);

  useEffect(() => {
    // Load the note data from storage
    const loadNoteData = () => {
      const savedResults = getStoredAnalysisResults();
      const note = savedResults.find((result) => result.id === noteId);

      if (note) {
        setNoteData(note);
      }

      setLoading(false);
    };

    loadNoteData();
  }, [noteId]);

  // Function to handle quiz generation
  const handleGenerateQuiz = async (result) => {
    try {
      setGeneratingQuiz(true);

      // Generate a quiz from the notes
      const generatedQuiz = await generateQuizFromNotes(
        result.markdown || result.rawText || ""
      );

      if (generatedQuiz && generatedQuiz.success) {
        // Add source data and store the quiz
        const quizToStore = {
          ...generatedQuiz,
          sourceData: {
            id: result.id,
            fileName: result.fileName || "Analysis Result",
            timestamp: result.timestamp,
          },
        };

        // Store the quiz and navigate to the root page with a URL parameter to switch to quiz view
        const storedQuiz = storeQuizResult(quizToStore);

        // Navigate back to the homepage with a URL parameter to indicate the quiz ID
        navigate(`/?quizId=${storedQuiz.id}`);
        return storedQuiz;
      } else {
        console.error(
          "Failed to generate quiz:",
          generatedQuiz?.error || "Unknown error"
        );
        return null;
      }
    } catch (error) {
      console.error("Error generating quiz:", error);
      return null;
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const handleBackToDashboard = () => {
    // If we came from the upload page, navigate back with state
    if (location.state?.fromUpload) {
      navigate("/", { state: { returnFromNotes: true } });
    } else {
      navigate("/");
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-8">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading notes...</p>
        </div>
      </div>
    );
  }

  if (!noteData) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg text-center">
          <h2 className="text-xl font-medium text-yellow-800 mb-2">
            Note Not Found
          </h2>
          <p className="text-yellow-700 mb-4">
            The note you're looking for doesn't exist or might have been
            deleted.
          </p>
          <Link
            to="/"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            <FiArrowLeft className="mr-2" /> Back
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 pb-24 md:pb-6 bg-gray-100 min-h-screen">
      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm flex items-center">
        <button
          onClick={handleBackToDashboard}
          className="inline-flex items-center text-indigo-600 hover:text-indigo-800"
        >
          <FiArrowLeft className="mr-1" /> Back
        </button>
        <h2 className="text-xl font-bold ml-4 text-gray-800">
          {noteData.fileName || "Analysis Results"}
        </h2>
      </div>

      <StructuredNotes
        result={noteData}
        onGenerateQuiz={() => handleGenerateQuiz(noteData)}
        generatingQuiz={generatingQuiz}
      />
    </div>
  );
};

export default NotesView;
