import React, { useState } from "react";
import StructuredNotes from "./StructuredNotes";

/**
 * Component for displaying analysis results with tabs
 *
 * @param {Object} props
 * @param {Array} props.results - Analysis results to display
 * @param {Function} props.onGenerateQuiz - Function to generate a quiz from results
 */
const ResultsTabView = ({ results, onGenerateQuiz }) => {
  const [activeTab, setActiveTab] = useState("structured"); // "structured" or "raw"

  const renderStructuredResult = (result, index) => {
    return (
      <div key={index}>
        <StructuredNotes result={result} onGenerateQuiz={onGenerateQuiz} />
      </div>
    );
  };

  return (
    <div className="mt-8">
      <div className="flex border-b border-gray-200 mb-4">
        <button
          className={`px-4 py-2 font-medium text-sm mr-2 ${
            activeTab === "structured"
              ? "text-indigo-600 border-b-2 border-indigo-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("structured")}
        >
          Structured Notes
        </button>
        <button
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === "raw"
              ? "text-indigo-600 border-b-2 border-indigo-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("raw")}
        >
          Raw Response
        </button>
      </div>

      <div className="space-y-6">
        {results.map((result, index) => (
          <div key={index}>
            {activeTab === "structured" ? (
              renderStructuredResult(result, index)
            ) : (
              <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                <pre className="text-xs text-gray-800 whitespace-pre-wrap overflow-auto max-h-96">
                  {result.description}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResultsTabView;
