import React from "react";
import { FiHome, FiAlertCircle } from "react-icons/fi";

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="text-center max-w-md w-full bg-white shadow-lg rounded-lg p-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-6">
          <FiAlertCircle className="w-8 h-8 text-red-600" />
        </div>

        <h1 className="text-3xl font-bold text-gray-800 mb-3">
          Page Not Found
        </h1>
        <p className="text-gray-600 mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <a
          href="/"
          className="inline-flex items-center justify-center px-5 py-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition-colors"
        >
          <FiHome className="mr-2" />
          Go back home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
