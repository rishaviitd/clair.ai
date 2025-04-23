import React from "react";
import { FiUpload, FiBook, FiLayers } from "react-icons/fi";
import { Link, useLocation } from "react-router-dom";

/**
 * Navigation component for switching between app views
 *
 * @param {Object} props
 * @param {string} props.view - Current active view
 * @param {Function} props.setView - Function to set current view
 * @param {number} props.savedResultsCount - Count of saved results
 */
const Navigation = ({ view, setView, savedResultsCount }) => {
  const location = useLocation();
  const currentPath = location.pathname;

  // Desktop navigation for larger screens
  const desktopNavigation = (
    <div className="hidden md:block mb-6">
      <div className="flex items-center mb-4">
        <div className="text-2xl font-bold text-indigo-600 mr-4">Clair.ai</div>
      </div>
      <div className="flex border-b border-gray-200">
        <button
          className={`px-5 py-3 font-medium text-sm mr-2 flex items-center transition-all ${
            view === "upload"
              ? "text-indigo-700 border-b-2 border-indigo-600 bg-indigo-50"
              : "text-gray-600 hover:text-indigo-700 hover:bg-indigo-50"
          }`}
          onClick={() => setView("upload")}
        >
          <FiUpload
            className={`mr-2 ${view === "upload" ? "text-indigo-600" : ""}`}
          />{" "}
          Upload
        </button>
        <button
          className={`px-5 py-3 font-medium text-sm mr-2 flex items-center transition-all ${
            view === "saved" || currentPath === "/quiz"
              ? "text-indigo-700 border-b-2 border-indigo-600 bg-indigo-50"
              : "text-gray-600 hover:text-indigo-700 hover:bg-indigo-50"
          }`}
          onClick={() => setView("saved")}
        >
          <FiBook
            className={`mr-2 ${
              view === "saved" || currentPath === "/quiz"
                ? "text-indigo-600"
                : ""
            }`}
          />{" "}
          Notes & Quiz
          {savedResultsCount > 0 && (
            <span className="ml-2 bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full text-xs">
              {savedResultsCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );

  // Mobile navigation for smaller screens
  const mobileNavigation = (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="flex justify-around">
        <button
          className={`flex flex-col items-center justify-center py-3 px-4 flex-1 ${
            view === "upload" ? "text-indigo-700 bg-indigo-50" : "text-gray-600"
          }`}
          onClick={() => setView("upload")}
        >
          <div className="relative">
            <FiUpload
              className={`text-xl mb-1 ${
                view === "upload" ? "text-indigo-600" : ""
              }`}
            />
          </div>
          <span className="text-xs font-medium">Upload</span>
        </button>
        <button
          className={`flex flex-col items-center justify-center py-3 px-4 flex-1 ${
            view === "saved" || currentPath === "/quiz"
              ? "text-indigo-700 bg-indigo-50"
              : "text-gray-600"
          }`}
          onClick={() => setView("saved")}
        >
          <div className="relative">
            <FiBook
              className={`text-xl mb-1 ${
                view === "saved" || currentPath === "/quiz"
                  ? "text-indigo-600"
                  : ""
              }`}
            />
            {savedResultsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {savedResultsCount > 9 ? "9+" : savedResultsCount}
              </span>
            )}
          </div>
          <span className="text-xs font-medium">Notes & Quiz</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {desktopNavigation}
      {mobileNavigation}
    </>
  );
};

export default Navigation;
