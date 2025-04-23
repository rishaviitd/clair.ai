import React from "react";
import { FiUpload, FiBook } from "react-icons/fi";
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
    <div className="hidden md:flex border-b border-gray-200 mb-6">
      <div className="flex overflow-x-auto">
        <button
          className={`px-4 py-2 font-medium text-sm mr-2 flex items-center ${
            view === "upload"
              ? "text-black border-b-2 border-black bg-gray-50"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setView("upload")}
        >
          <FiUpload
            className={`mr-2 ${view === "upload" ? "fill-current" : ""}`}
          />{" "}
          Upload
        </button>
        <button
          className={`px-4 py-2 font-medium text-sm mr-2 flex items-center ${
            view === "saved" || currentPath === "/quiz"
              ? "text-black border-b-2 border-black bg-gray-50"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setView("saved")}
        >
          <FiBook
            className={`mr-2 ${
              view === "saved" || currentPath === "/quiz" ? "fill-current" : ""
            }`}
          />{" "}
          Notes & Quiz
        </button>
      </div>
    </div>
  );

  // Mobile bottom tab navigation for smaller screens
  const mobileNavigation = (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="flex justify-around">
        <button
          className={`flex flex-col items-center justify-center py-2 px-4 flex-1 ${
            view === "upload" ? "text-black bg-gray-100" : "text-gray-500"
          }`}
          onClick={() => setView("upload")}
        >
          <div className="relative">
            <FiUpload
              className={`text-xl mb-1 ${
                view === "upload" ? "fill-current" : ""
              }`}
            />
          </div>
          <span className="text-xs">Upload</span>
        </button>
        <button
          className={`flex flex-col items-center justify-center py-2 px-4 flex-1 ${
            view === "saved" || currentPath === "/quiz"
              ? "text-black bg-gray-100"
              : "text-gray-500"
          }`}
          onClick={() => setView("saved")}
        >
          <div className="relative">
            <FiBook
              className={`text-xl mb-1 ${
                view === "saved" || currentPath === "/quiz"
                  ? "fill-current"
                  : ""
              }`}
            />
          </div>
          <span className="text-xs">Notes & Quiz</span>
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
