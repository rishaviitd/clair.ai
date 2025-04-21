import React from "react";
import {
  FiUpload,
  FiDatabase,
  FiList,
  FiBookOpen,
  FiHelpCircle,
} from "react-icons/fi";

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
  // Desktop navigation for larger screens
  const desktopNavigation = (
    <div className="hidden md:flex border-b border-gray-200 mb-6">
      <div className="flex overflow-x-auto">
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
    </div>
  );

  // Mobile bottom tab navigation for smaller screens
  const mobileNavigation = (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="flex justify-around">
        <button
          className={`flex flex-col items-center justify-center py-2 px-4 flex-1 ${
            view === "upload" ? "text-green-600" : "text-gray-500"
          }`}
          onClick={() => setView("upload")}
        >
          <div className="relative">
            <FiUpload className="text-xl mb-1" />
          </div>
          <span className="text-xs">Upload</span>
        </button>
        <button
          className={`flex flex-col items-center justify-center py-2 px-4 flex-1 ${
            view === "saved" ? "text-green-600" : "text-gray-500"
          }`}
          onClick={() => setView("saved")}
        >
          <div className="relative">
            <FiDatabase className="text-xl mb-1" />
            {savedResultsCount > 0 && (
              <span className="absolute -top-1 -right-1 text-xs bg-green-500 text-white rounded-full w-4 h-4 flex items-center justify-center">
                {savedResultsCount}
              </span>
            )}
          </div>
          <span className="text-xs">Saved</span>
        </button>
        <button
          className={`flex flex-col items-center justify-center py-2 px-4 flex-1 ${
            view === "quizzes" ? "text-green-600" : "text-gray-500"
          }`}
          onClick={() => setView("quizzes")}
        >
          <div className="relative">
            <FiHelpCircle className="text-xl mb-1" />
            {savedQuizzesCount > 0 && (
              <span className="absolute -top-1 -right-1 text-xs bg-green-500 text-white rounded-full w-4 h-4 flex items-center justify-center">
                {savedQuizzesCount}
              </span>
            )}
          </div>
          <span className="text-xs">Quizzes</span>
        </button>
        {quizResult ? (
          <button
            className={`flex flex-col items-center justify-center py-2 px-4 flex-1 ${
              view === "quiz" ? "text-green-600" : "text-gray-500"
            }`}
            onClick={() => setView("quiz")}
          >
            <div className="relative">
              <FiBookOpen className="text-xl mb-1" />
            </div>
            <span className="text-xs">Quiz</span>
          </button>
        ) : (
          <div className="flex-1"></div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {desktopNavigation}
      {mobileNavigation}
      <div className="md:hidden h-16 mb-6">
        {/* Spacer for mobile view to account for fixed bottom navigation */}
      </div>
    </>
  );
};

export default Navigation;
