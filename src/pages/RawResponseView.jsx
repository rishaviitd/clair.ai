import React, { useState } from "react";
import { FiArrowLeft, FiMessageSquare, FiServer } from "react-icons/fi";

const RawResponseView = ({ rawResponse, onBack }) => {
  const [activeTab, setActiveTab] = useState("text");

  if (!rawResponse) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center mb-4">
          <button
            onClick={onBack}
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <FiArrowLeft className="mr-1" /> Back
          </button>
        </div>
        <div className="bg-red-50 border border-red-300 p-4 rounded">
          <p className="text-red-700">No raw response data available.</p>
        </div>
      </div>
    );
  }

  // Get the quiz object from the parent component
  const quizResult = typeof rawResponse === "object" ? rawResponse : null;
  const rawText =
    quizResult?.rawText || (typeof rawResponse === "string" ? rawResponse : "");
  const rawApiResponse = quizResult?.rawApiResponse || "";

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center mb-4">
        <button
          onClick={onBack}
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <FiArrowLeft className="mr-1" /> Back
        </button>
        <h2 className="text-xl font-semibold ml-2">Raw Gemini Response</h2>
      </div>

      <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-gray-700 mb-2">Response Info</h3>
        <p className="text-gray-600 text-sm mb-1">
          This is the raw, unprocessed response from the Gemini API for quiz
          generation.
        </p>
        <p className="text-gray-600 text-sm">
          You can use this to debug issues with quiz formatting or content.
        </p>
      </div>

      <div className="flex border-b border-gray-300 mb-4">
        <button
          className={`px-4 py-2 flex items-center ${
            activeTab === "text"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-600 hover:text-gray-800"
          }`}
          onClick={() => setActiveTab("text")}
        >
          <FiMessageSquare className="mr-2" /> Text Response
        </button>
        <button
          className={`px-4 py-2 flex items-center ${
            activeTab === "api"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-600 hover:text-gray-800"
          }`}
          onClick={() => setActiveTab("api")}
        >
          <FiServer className="mr-2" /> API Response
        </button>
      </div>

      {activeTab === "text" && (
        <div className="bg-white border border-gray-300 rounded-lg">
          <div className="px-4 py-3 bg-gray-100 border-b border-gray-300 rounded-t-lg">
            <h3 className="font-mono text-sm font-semibold">Text Response</h3>
            <p className="text-xs text-gray-500">
              Raw text content returned by Gemini
            </p>
          </div>
          <div className="overflow-auto max-h-[70vh] p-4 bg-gray-50">
            <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 break-words">
              {rawText || "No text response available"}
            </pre>
          </div>
        </div>
      )}

      {activeTab === "api" && (
        <div className="bg-white border border-gray-300 rounded-lg">
          <div className="px-4 py-3 bg-gray-100 border-b border-gray-300 rounded-t-lg">
            <h3 className="font-mono text-sm font-semibold">
              Full API Response
            </h3>
            <p className="text-xs text-gray-500">
              Complete JSON response from the Gemini API
            </p>
          </div>
          <div className="overflow-auto max-h-[70vh] p-4 bg-gray-50">
            <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800">
              {rawApiResponse || "No API response data available"}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default RawResponseView;
