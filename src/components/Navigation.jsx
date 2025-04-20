import React from "react";
import { FiUpload, FiDatabase, FiList } from "react-icons/fi";

/**
 * Navigation component for switching between app views
 *
 * @param {Object} props
 * @param {string} props.view - Current active view
 * @param {Function} props.setView - Function to set current view
 * @param {number} props.savedResultsCount - Count of saved results
 * @param {number} props.savedQuizzesCount - Count of saved quizzes
 * @param {Object} props.quizResult - Current quiz result, if any
 */
const Navigation = ({
  view,
  setView,
  savedResultsCount,
  savedQuizzesCount,
  quizResult,
}) => {
  return (
    <div className="flex border-b border-gray-200 mb-6">
      <button
        className={`px-4 py-2 font-medium text-sm mr-2 flex items-center ${
          view === "upload"
            ? "text-indigo-600 border-b-2 border-indigo-600"
            : "text-gray-500 hover:text-gray-700"
        }`}
        onClick={() => setView("upload")}
      >
        <FiUpload className="mr-2" /> Upload & Analyze
      </button>
      <button
        className={`px-4 py-2 font-medium text-sm mr-2 flex items-center ${
          view === "saved"
            ? "text-indigo-600 border-b-2 border-indigo-600"
            : "text-gray-500 hover:text-gray-700"
        }`}
        onClick={() => setView("saved")}
      >
        <FiDatabase className="mr-2" /> Saved Analysis ({savedResultsCount})
      </button>
      <button
        className={`px-4 py-2 font-medium text-sm mr-2 flex items-center ${
          view === "quizzes"
            ? "text-indigo-600 border-b-2 border-indigo-600"
            : "text-gray-500 hover:text-gray-700"
        }`}
        onClick={() => setView("quizzes")}
      >
        <FiList className="mr-2" /> Saved Quizzes ({savedQuizzesCount})
      </button>
      {quizResult && (
        <button
          className={`px-4 py-2 font-medium text-sm flex items-center ${
            view === "quiz"
              ? "text-indigo-600 border-b-2 border-indigo-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setView("quiz")}
        >
          <FiList className="mr-2" /> Current Quiz
        </button>
      )}
    </div>
  );
};

export default Navigation;
