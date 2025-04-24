import React from "react";
import { FiBookOpen } from "react-icons/fi";

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
                  <h4 className="font-medium text-gray-800">
                    {quiz.sourceData?.fileName || "Notes Analysis"}
                  </h4>
                  {quiz.attempted ? (
                    <div className="text-sm text-gray-600 mt-1">
                      Score:{" "}
                      <span className="font-medium">
                        {quiz.score.obtained}/{quiz.score.total}
                      </span>
                      <span className="text-gray-500 ml-1">
                        ({quiz.score.percentage}%)
                      </span>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 mt-1">
                      Not attempted yet
                    </p>
                  )}
                </div>
                <button
                  onClick={() => onLoadQuiz(quiz)}
                  className={`px-3 py-1.5 text-white text-sm rounded-md transition-colors flex items-center ${
                    quiz.attempted
                      ? "bg-indigo-600 hover:bg-indigo-700"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  <FiBookOpen className="mr-2" />
                  {quiz.attempted ? "Review" : "Start"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedQuizzes;
