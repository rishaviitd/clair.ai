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

  // Toggle collapsed state for a specific result
  const toggleResultCollapse = (resultId) => {
    setCollapsedResults((prev) => ({
      ...prev,
      [resultId]: !prev[resultId],
    }));
  };

  // Format the file name to extract the date
  const formatFileName = (fileName) => {
    if (!fileName) return "Notes";

    // Try to extract date from filenames like "WhatsApp Image 2025-03-28 at 18.51.07 (1).jpeg"
    const dateMatch = fileName.match(/(\d{4}-\d{2}-\d{2})/);
    if (dateMatch && dateMatch[1]) {
      return dateMatch[1];
    }

    return fileName;
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
                      <h4 className="font-medium text-md md:text-lg truncate max-w-[200px] md:max-w-[300px]">
                        {formatFileName(result.fileName)}
                      </h4>
                      {/* <p className="text-xs text-gray-500">
                        {new Date(result.timestamp).toLocaleString()}
                      </p> */}
                    </div>
                  </div>
                  <div
                    className="flex space-x-2"
                    onClick={(e) => e.stopPropagation()}
                  >
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
                        onGenerateQuiz(result);
                      }}
                      className="p-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center justify-center"
                      disabled={generatingQuiz}
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
                  <div className="bg-gray-50 p-3">
                    <div className="space-y-2">
                      {quizzesBySourceId[result.id].map((quiz, index) => (
                        <div
                          key={quiz.id}
                          className="bg-white p-3 rounded-md border border-gray-200 flex flex-col sm:flex-row justify-between sm:items-center"
                        >
                          <div className="mb-2 sm:mb-0">
                            <p className="text-sm font-medium">
                              Quiz-{index + 1}
                            </p>
                            {/* <p className="text-xs text-gray-500">
                              {new Date(quiz.timestamp).toLocaleString()}
                            </p> */}
                          </div>
                          <button
                            onClick={() => onLoadQuiz(quiz)}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors flex items-center justify-center"
                          >
                            Start
                          </button>
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
