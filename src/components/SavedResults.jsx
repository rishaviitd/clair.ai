import React, { useState } from "react";
import {
  FiEdit,
  FiChevronDown,
  FiChevronUp,
  FiEye,
  FiFileText,
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
  // Keep track of which result sections are collapsed
  const [collapsedResults, setCollapsedResults] = useState({});

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

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-700">
          Notes and Quizzes
        </h3>
        <span className="text-sm text-gray-500">
          {savedResults.length} results
        </span>
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
              <div className="border-b p-3 md:p-4">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                  <div className="flex items-center mb-3 md:mb-0">
                    <button
                      onClick={() => toggleResultCollapse(result.id)}
                      className="mr-2 p-1 rounded-full hover:bg-gray-100"
                      aria-label={
                        collapsedResults[result.id] ? "Expand" : "Collapse"
                      }
                    >
                      {collapsedResults[result.id] ? (
                        <FiChevronDown className="text-gray-500" />
                      ) : (
                        <FiChevronUp className="text-gray-500" />
                      )}
                    </button>
                    <div>
                      <h4 className="font-medium text-md md:text-lg truncate max-w-[200px] md:max-w-[300px]">
                        {result.fileName || "Analysis Result"}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {new Date(result.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Link
                      to={`/notes/${result.id}`}
                      className="px-2 py-1 md:px-3 md:py-1 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition-colors inline-flex items-center"
                    >
                      <FiEye className="mr-1" />
                      <span className="hidden sm:inline">View Notes</span>
                    </Link>
                    <button
                      onClick={() => onGenerateQuiz(result)}
                      className="px-2 py-1 md:px-3 md:py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors flex items-center"
                      disabled={generatingQuiz}
                    >
                      <FiEdit className="mr-1" />
                      <span className="hidden sm:inline">
                        {generatingQuiz && result.id === selectedResult?.id
                          ? "Generating..."
                          : "Generate Quiz"}
                      </span>
                      <span className="sm:hidden">
                        {generatingQuiz && result.id === selectedResult?.id
                          ? "..."
                          : "Quiz"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Quizzes generated from this result */}
              {!collapsedResults[result.id] &&
                quizzesBySourceId[result.id] &&
                quizzesBySourceId[result.id].length > 0 && (
                  <div className="bg-gray-50 p-3">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">
                      Generated Quizzes ({quizzesBySourceId[result.id].length})
                    </h5>
                    <div className="space-y-2">
                      {quizzesBySourceId[result.id].map((quiz) => (
                        <div
                          key={quiz.id}
                          className="bg-white p-3 rounded-md border border-gray-200 flex flex-col sm:flex-row justify-between sm:items-center"
                        >
                          <div className="mb-2 sm:mb-0">
                            <p className="text-sm font-medium">
                              Quiz from {result.fileName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(quiz.timestamp).toLocaleString()}
                            </p>
                          </div>
                          <button
                            onClick={() => onLoadQuiz(quiz)}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
                          >
                            <FiFileText className="mr-1" />
                            Take Quiz
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
