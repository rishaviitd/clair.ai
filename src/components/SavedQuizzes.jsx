import React from "react";

/**
 * Component for displaying saved quizzes
 *
 * @param {Object} props
 * @param {Array} props.savedQuizzes - Saved quizzes array
 * @param {Function} props.onLoadQuiz - Function to load a quiz
 */
const SavedQuizzes = ({ savedQuizzes, onLoadQuiz }) => {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-700">
        Saved Quizzes
      </h3>

      {savedQuizzes.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No saved quizzes yet. Generate a quiz from your notes to get started.
        </div>
      ) : (
        <div className="space-y-4">
          {savedQuizzes.map((quiz) => (
            <div key={quiz.id} className="border rounded-md p-4 bg-white">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium">
                    Quiz: {quiz.sourceData?.fileName || "Notes Analysis"}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {new Date(quiz.timestamp).toLocaleString()}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => onLoadQuiz(quiz)}
                    className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition-colors"
                  >
                    Take Quiz
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedQuizzes;
