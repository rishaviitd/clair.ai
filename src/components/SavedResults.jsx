import React, { useState, useEffect } from "react";
import {
  FiChevronDown,
  FiChevronUp,
  FiEye,
  FiFileText,
  FiPlayCircle,
  FiList,
} from "react-icons/fi";
import { Link } from "react-router-dom";

/**
 * Component for displaying saved analysis results with collapsible sections
 * and integrated quizzes
 *
 * @param {Object} props
 * @param {Array} props.savedResults - Saved analysis results
 * @param {Array} props.savedQuizzes - Saved quizzes
 * @param {Function} props.onGenerateQuiz - Function to generate a quiz from a result
 * @param {boolean} props.generatingQuiz - Whether a quiz is being generated
 * @param {Object} props.selectedResult - Currently selected result, if any
 * @param {Function} props.onLoadQuiz - Function to load a saved quiz
 */
const SavedResults = ({
  savedResults,
  savedQuizzes,
  onGenerateQuiz,
  generatingQuiz,
  selectedResult,
  onLoadQuiz,
}) => {
  // Keep track of which result sections are collapsed - all collapsed by default
  const [collapsedResults, setCollapsedResults] = useState({});

  // Initialize all results as collapsed by default
  useEffect(() => {
    if (savedResults.length > 0) {
      const initialCollapsedState = savedResults.reduce((acc, result) => {
        acc[result.id] = true;
        return acc;
      }, {});
      setCollapsedResults(initialCollapsedState);
    }
  }, [savedResults]);

  // Group quizzes by source result ID
  const quizzesBySourceId = savedQuizzes.reduce((acc, quiz) => {
    if (quiz.sourceData && quiz.sourceData.id) {
      if (!acc[quiz.sourceData.id]) {
        acc[quiz.sourceData.id] = [];
      }
      acc[quiz.sourceData.id].push(quiz);
    }
    return acc;
  }, {});

  // Debug saved quizzes
  useEffect(() => {
    console.log("SavedResults - All saved quizzes:", savedQuizzes);
    console.log("SavedResults - Quizzes by source ID:", quizzesBySourceId);

    // Check if any quizzes have been attempted
    const attemptedQuizzes = savedQuizzes.filter((quiz) => quiz.attempted);
    console.log("SavedResults - Attempted quizzes:", attemptedQuizzes);

    // Check localStorage directly with the correct key
    const localStorageQuizzes = JSON.parse(
      localStorage.getItem("notesQuizResults") || "[]"
    );
    console.log("SavedResults - Quizzes in localStorage:", localStorageQuizzes);
  }, [savedQuizzes, quizzesBySourceId]);

  // Toggle collapsed state for a specific result
  const toggleResultCollapse = (resultId) => {
    setCollapsedResults((prev) => ({
      ...prev,
      [resultId]: !prev[resultId],
    }));
  };

  // Get current date in DD-MM-YYYY format with day of week
  const getCurrentDateFormatted = () => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, "0");
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const year = today.getFullYear();
    const weekdays = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const dayOfWeek = weekdays[today.getDay()];

    return `${day}-${month}-${year} [${dayOfWeek}]`;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-700">
          Notes and Quizzes
        </h3>
      </div>

      {savedResults.length === 0 ? (
        <div className="text-center py-6 text-gray-500 bg-white rounded-lg border border-gray-200">
          No saved analysis results yet. Upload and analyze some notes to get
          started.
        </div>
      ) : (
        <div className="space-y-4">
          {savedResults.map((result) => (
            <div
              key={result.id}
              className="border rounded-lg bg-white overflow-hidden shadow-sm"
            >
              <div
                className="border-b p-3 md:p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => toggleResultCollapse(result.id)}
              >
                <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                  <div className="flex items-center mb-3 md:mb-0">
                    <div
                      className="mr-2 p-1 rounded-full"
                      aria-label={
                        collapsedResults[result.id] ? "Expand" : "Collapse"
                      }
                    >
                      {collapsedResults[result.id] ? (
                        <FiChevronDown className="text-gray-500" />
                      ) : (
                        <FiChevronUp className="text-gray-500" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">
                        {getCurrentDateFormatted()}
                      </h4>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/notes/${result.id}`}
                      className="p-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center justify-center"
                      aria-label="View Notes"
                    >
                      <FiEye />
                    </Link>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log(
                          "Generate Quiz button clicked for result:",
                          result.id
                        );
                        console.log(
                          "Button disabled state:",
                          generatingQuiz ||
                            quizzesBySourceId[result.id]?.some(
                              (quiz) => quiz.attempted
                            )
                        );
                        console.log(
                          "Attempted quizzes for this result:",
                          quizzesBySourceId[result.id]?.filter(
                            (quiz) => quiz.attempted
                          )
                        );
                        try {
                          onGenerateQuiz(result);
                        } catch (error) {
                          console.error("Error calling onGenerateQuiz:", error);
                        }
                      }}
                      className="p-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center justify-center"
                      /* Temporarily removed disabled state for testing
                      disabled={
                        generatingQuiz ||
                        quizzesBySourceId[result.id]?.some(
                          (quiz) => quiz.attempted
                        )
                      }
                      */
                      aria-label="Generate Quiz"
                    >
                      {generatingQuiz && result.id === selectedResult?.id ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        <FiPlayCircle className="text-lg" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Quizzes generated from this result */}
              {!collapsedResults[result.id] &&
                quizzesBySourceId[result.id] &&
                quizzesBySourceId[result.id].length > 0 && (
                  <div className="bg-gray-50 p-3 mt-3">
                    <div className="space-y-2">
                      {quizzesBySourceId[result.id].map((quiz, quizIndex) => (
                        <div
                          key={quiz.id}
                          className="bg-white p-3 rounded-md border border-gray-200 flex flex-col sm:flex-row justify-between sm:items-center"
                        >
                          <div className="mb-2 sm:mb-0">
                            <div className="flex items-center">
                              <div className="text-sm font-medium">
                                {quiz.attempted
                                  ? `Quiz ${
                                      quiz.quizNumber || quizIndex + 1
                                    } Results`
                                  : `Quiz ${quiz.quizNumber || quizIndex + 1}`}
                              </div>
                              {quiz.isAdaptive && (
                                <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                                  Adaptive
                                </span>
                              )}
                            </div>
                            {quiz.attempted && (
                              <div className="text-sm text-gray-600">
                                <span className="font-medium">
                                  {quiz.score.obtained}/{quiz.score.total}
                                </span>
                                <span className="text-gray-500 ml-1">
                                  ({quiz.score.percentage}%)
                                </span>
                              </div>
                            )}
                          </div>
                          {quiz.attempted ? (
                            <button
                              onClick={() => onLoadQuiz(quiz)}
                              className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition-colors flex items-center justify-center"
                            >
                              Review
                            </button>
                          ) : (
                            <button
                              onClick={() => onLoadQuiz(quiz)}
                              className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors flex items-center justify-center"
                            >
                              Start
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedResults;
