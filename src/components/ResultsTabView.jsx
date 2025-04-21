import React from "react";
import StructuredNotes from "./StructuredNotes";

/**
 * Component for displaying analysis results
 *
 * @param {Object} props
 * @param {Array} props.results - Analysis results to display
 * @param {Function} props.onGenerateQuiz - Function to generate a quiz from results
 */
const ResultsTabView = ({ results, onGenerateQuiz }) => {
  return (
    <div className="mt-8">
      <div className="space-y-6">
        {results.map((result, index) => (
          <div key={index}>
            <StructuredNotes result={result} onGenerateQuiz={onGenerateQuiz} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResultsTabView;
