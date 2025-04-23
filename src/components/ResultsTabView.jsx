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
      <div className="mt-8 bg-yellow-50 p-4 rounded-md border border-yellow-200 text-center">
        <p className="text-yellow-700">No valid analysis results available.</p>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="bg-white p-6 rounded-lg shadow-md text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiCheckCircle className="text-green-600 text-3xl" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Notes Processed Successfully!
          </h3>
          <p className="text-gray-600">
            Your notes have been analyzed and are ready for review
          </p>
        </div>

        <div className="flex justify-center space-x-4">
          <button
            onClick={() => onGenerateQuiz(results[0])}
            disabled={generatingQuiz}
            className={`px-4 py-2 rounded-md transition-colors flex items-center ${
              generatingQuiz
                ? "bg-green-300 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            } text-white`}
          >
            {generatingQuiz ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                Generating Quiz...
              </>
            ) : (
              <>
                <FiEdit className="mr-2" /> Generate Quiz
              </>
            )}
          </button>

          <button
            onClick={() => onViewNotes(results[0].id)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center"
          >
            <FiBookOpen className="mr-2" /> View Notes
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultsTabView;
