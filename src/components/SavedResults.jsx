import React from "react";
import { FiEdit } from "react-icons/fi";

/**
 * Component for displaying saved analysis results
 *
 * @param {Object} props
 * @param {Array} props.savedResults - Saved analysis results
 * @param {Function} props.onViewResult - Function to view a saved result
 * @param {Function} props.onGenerateQuiz - Function to generate a quiz from a result
 * @param {boolean} props.generatingQuiz - Whether a quiz is being generated
 * @param {Object} props.selectedResult - Currently selected result, if any
 */
const SavedResults = ({
  savedResults,
  onViewResult,
  onGenerateQuiz,
  generatingQuiz,
  selectedResult,
}) => {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-700">
        Saved Analysis Results
      </h3>

      {savedResults.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No saved analysis results yet. Upload and analyze some notes to get
          started.
        </div>
      ) : (
        <div className="space-y-4">
          {savedResults.map((result) => (
            <div key={result.id} className="border rounded-md p-4 bg-white">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium">
                    {result.fileName || "Analysis Result"}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {new Date(result.timestamp).toLocaleString()}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => onViewResult(result)}
                    className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition-colors"
                  >
                    View
                  </button>
                  <button
                    onClick={() => onGenerateQuiz(result)}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors flex items-center"
                    disabled={generatingQuiz}
                  >
                    <FiEdit className="mr-1" />
                    {generatingQuiz && result.id === selectedResult?.id
                      ? "Generating..."
                      : "Generate Quiz"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedResults;
