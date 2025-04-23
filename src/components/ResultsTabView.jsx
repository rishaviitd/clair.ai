import React from "react";
import { FiEdit, FiBookOpen, FiCheckCircle } from "react-icons/fi";

/**
 * Component for displaying analysis results with action buttons
 *
 * @param {Object} props
 * @param {Array} props.results - Analysis results to display
 * @param {Function} props.onGenerateQuiz - Function to generate a quiz from results
 * @param {boolean} props.generatingQuiz - Whether a quiz is being generated
 * @param {Function} props.onViewNotes - Function to handle viewing notes
 */
const ResultsTabView = ({
  results,
  onGenerateQuiz,
  generatingQuiz = false,
  onViewNotes,
}) => {
  // Make sure we have results and they have IDs
  if (!results || results.length === 0 || !results[0].id) {
    return (
      <div className="mt-4 bg-yellow-50 p-4 rounded-md border border-yellow-200 text-center">
        <p className="text-yellow-700">No valid analysis results available.</p>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm text-center">
        <div className="mb-4 md:mb-6">
          <div className="w-14 h-14 md:w-16 md:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
            <FiCheckCircle className="text-green-600 text-2xl md:text-3xl" />
          </div>
          <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-2">
            Notes Processed Successfully!
          </h3>
          <p className="text-sm md:text-base text-gray-600">
            Your notes have been analyzed and are ready for review
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:space-x-4">
          <button
            onClick={() => onGenerateQuiz(results[0])}
            disabled={generatingQuiz}
            className={`px-3 py-2 md:px-4 md:py-2 rounded-md transition-colors flex items-center justify-center ${
              generatingQuiz
                ? "bg-green-300 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            } text-white`}
          >
            {generatingQuiz ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                <span className="hidden sm:inline">Generating Quiz...</span>
                <span className="sm:hidden">Processing...</span>
              </>
            ) : (
              <>
                <FiEdit className="mr-2" />
                <span className="hidden sm:inline">Generate Quiz</span>
                <span className="sm:hidden">Generate Quiz</span>
              </>
            )}
          </button>

          <button
            onClick={() => onViewNotes(results[0].id)}
            className="px-3 py-2 md:px-4 md:py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center justify-center"
          >
            <FiBookOpen className="mr-2" />
            <span>View Notes</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultsTabView;
