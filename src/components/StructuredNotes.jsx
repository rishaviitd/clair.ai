import React from "react";
import { FiEdit } from "react-icons/fi";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import "katex/dist/katex.min.css";
import { FiArrowLeft } from "react-icons/fi";
import { useNavigate, useLocation } from "react-router-dom";

/**
 * StructuredNotes component for displaying raw Gemini response
 *
 * @param {Object} props
 * @param {Object} props.result - The analysis result containing markdown content
 * @param {Function} props.onGenerateQuiz - Function to call when Generate Quiz button is clicked
 * @param {boolean} props.generatingQuiz - Whether a quiz is being generated
 */
const StructuredNotes = ({
  result,
  onGenerateQuiz,
  generatingQuiz = false,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we have valid content
  if (!result || (!result.markdown && !result.description)) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <p className="text-yellow-600">No content available to display.</p>
      </div>
    );
  }

  const handleBackToDashboard = () => {
    // If we came from the upload page, navigate back with state
    if (location.state?.fromUpload) {
      navigate("/?tab=saved", { state: { returnFromNotes: true } });
    } else {
      navigate("/?tab=saved");
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6 pb-4 border-b">
        <div className="mb-6 bg-white p-4 rounded-lg shadow-sm flex items-center">
          <button
            onClick={handleBackToDashboard}
            className="inline-flex items-center text-indigo-600 hover:text-indigo-800"
          >
            <FiArrowLeft className="mr-1" /> Back
          </button>
        </div>{" "}
        <div className="flex gap-2">
          <button
            onClick={() => onGenerateQuiz(result)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center"
            disabled={generatingQuiz}
          >
            {generatingQuiz ? (
              <>
                <span className="mr-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Generating Quiz...
              </>
            ) : (
              <>
                <FiEdit className="mr-2" /> Generate Quiz
              </>
            )}
          </button>
        </div>
      </div>

      <div className="prose max-w-none">
        <ReactMarkdown
          children={result.markdown}
          remarkPlugins={[remarkMath]}
          rehypePlugins={[rehypeKatex, rehypeRaw]}
          components={{
            h1: ({ node, ...props }) => (
              <h1 className="text-3xl font-bold mt-6 mb-4" {...props} />
            ),
            h2: ({ node, ...props }) => (
              <h2 className="text-2xl font-bold mt-5 mb-3" {...props} />
            ),
            h3: ({ node, ...props }) => (
              <h3 className="text-xl font-bold mt-4 mb-2" {...props} />
            ),

            // Style block quotes
            blockquote: ({ node, ...props }) => (
              <blockquote
                className="border-l-4 border-gray-300 pl-4 italic my-4 text-gray-700"
                {...props}
              />
            ),

            // Style lists
            ul: ({ node, ...props }) => (
              <ul className="list-disc pl-5 mb-4" {...props} />
            ),
            ol: ({ node, ...props }) => (
              <ol className="list-decimal pl-5 mb-4" {...props} />
            ),

            // Style code blocks and inline code
            code: ({ node, inline, ...props }) =>
              inline ? (
                <code
                  className="font-mono bg-gray-100 px-1 rounded"
                  {...props}
                />
              ) : (
                <code
                  className="block bg-gray-100 p-3 rounded font-mono text-sm overflow-auto"
                  {...props}
                />
              ),

            // Style emphasis and strong
            em: ({ node, ...props }) => <em className="italic" {...props} />,
            strong: ({ node, ...props }) => (
              <strong className="font-bold" {...props} />
            ),

            // Handle the div wrapper for display math
            div: ({ node, className, ...props }) => {
              if (className === "math-display-wrapper") {
                return (
                  <div
                    className="flex justify-center my-6 text-center"
                    {...props}
                  />
                );
              }
              return <div {...props} />;
            },
          }}
        />
      </div>
    </div>
  );
};

export default StructuredNotes;
