import React, { useState } from "react";
import { FiEdit } from "react-icons/fi";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { InlineMath, BlockMath } from "react-katex";

/**
 * StructuredNotes component for displaying hierarchical structured notes data
 *
 * @param {Object} props
 * @param {Object} props.result - The analysis result containing structuredData
 * @param {Function} props.onGenerateQuiz - Function to call when Generate Quiz button is clicked
 */
const StructuredNotes = ({ result, onGenerateQuiz }) => {
  const [debugMode, setDebugMode] = useState(false);

  // Component to render a topic with its subtopics and concepts
  const renderTopic = (topic) => {
    if (!topic) return null;

    // Handle different naming conventions
    const topicTitle = topic.title || topic.name || "Unnamed Topic";
    const topicId =
      topic.id || `topic_${topicTitle.toLowerCase().replace(/\s+/g, "_")}`;

    // Normalize subtopics property
    let subtopics = topic.subtopics || [];

    // If no subtopics but has concepts array at top level
    if (
      subtopics.length === 0 &&
      Array.isArray(topic.concepts) &&
      topic.concepts.length > 0
    ) {
      // Create a default subtopic that contains all concepts
      subtopics = [
        {
          id: `default_subtopic_${topicId}`,
          title: topicTitle + " Concepts",
          concepts: topic.concepts,
        },
      ];
    }

    return (
      <div key={topicId} className="mb-8 border-l-4 border-indigo-500 pl-4">
        <h3 className="text-xl font-bold text-indigo-700">{topicTitle}</h3>

        {subtopics.length > 0 ? (
          subtopics.map((subtopic) => {
            if (!subtopic) return null;

            // Handle different naming conventions
            const subtopicTitle =
              subtopic.title || subtopic.name || "Unnamed Subtopic";
            const subtopicId =
              subtopic.id ||
              `subtopic_${subtopicTitle.toLowerCase().replace(/\s+/g, "_")}`;

            return (
              <div
                key={subtopicId}
                className="mt-4 ml-4 border-l-2 border-indigo-300 pl-4"
              >
                <h4 className="text-lg font-semibold text-indigo-600">
                  {subtopicTitle}
                </h4>

                {Array.isArray(subtopic.concepts) &&
                subtopic.concepts.length > 0 ? (
                  subtopic.concepts.map((concept) => renderConcept(concept))
                ) : (
                  <p className="text-sm italic text-gray-500 mt-2">
                    No concepts found in this subtopic
                  </p>
                )}
              </div>
            );
          })
        ) : (
          <p className="text-sm italic text-gray-500 mt-2">
            No subtopics found
          </p>
        )}
      </div>
    );
  };

  // Component to render a concept
  const renderConcept = (concept) => {
    if (!concept) return null;

    // Handle different naming conventions
    const conceptName = concept.name || concept.title || "Unnamed Concept";
    const conceptId =
      concept.id || `concept_${conceptName.toLowerCase().replace(/\s+/g, "_")}`;

    // Normalize properties that might not exist
    const definition = Array.isArray(concept.definition)
      ? concept.definition.join("\n")
      : concept.definition || "";
    const formulae = Array.isArray(concept.formulae)
      ? concept.formulae
      : concept.formulae
      ? [concept.formulae]
      : [];
    const examples = Array.isArray(concept.examples)
      ? concept.examples
      : concept.examples
      ? [concept.examples]
      : [];
    const subconcepts = Array.isArray(concept.subconcepts)
      ? concept.subconcepts
      : [];
    const pageNumbers = Array.isArray(concept.page_numbers)
      ? concept.page_numbers
      : concept.page_numbers
      ? [concept.page_numbers]
      : [];

    // Helper function to improve LaTeX rendering
    const renderFormulae = (formula) => {
      if (!formula) return "";

      // If formula already has $ delimiters, extract the content between them
      if (formula.includes("$")) {
        const matches = formula.match(/\$(.*?)\$/);
        if (matches && matches[1]) {
          return matches[1];
        }
      }

      // Return the formula as is if no $ delimiters found
      return formula;
    };

    return (
      <div
        key={conceptId}
        className="mt-3 ml-4 bg-white p-4 rounded-md shadow-sm"
      >
        <h5 className="font-medium text-gray-800">{conceptName}</h5>

        {definition && (
          <div className="mt-2">
            <p className="text-sm text-gray-700">
              <span className="font-medium">Definition:</span>{" "}
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
              >
                {definition}
              </ReactMarkdown>
            </p>
          </div>
        )}

        {formulae.length > 0 && (
          <div className="mt-2">
            <p className="text-sm font-medium text-gray-700">Formulae:</p>
            <ul className="list-disc list-inside ml-2">
              {formulae.map((formula, idx) => (
                <li
                  key={idx}
                  className="text-sm text-gray-600 font-mono bg-gray-50 p-1 my-1 rounded"
                >
                  <InlineMath math={renderFormulae(formula)} />
                </li>
              ))}
            </ul>
          </div>
        )}

        {examples.length > 0 && (
          <div className="mt-2">
            <p className="text-sm font-medium text-gray-700">Examples:</p>
            <ul className="list-disc list-inside ml-2">
              {examples.map((example, idx) => (
                <li key={idx} className="text-sm text-gray-600">
                  <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                  >
                    {example}
                  </ReactMarkdown>
                </li>
              ))}
            </ul>
          </div>
        )}

        {subconcepts.length > 0 && (
          <div className="mt-3 border-l-2 border-gray-200 pl-3">
            <p className="text-sm font-medium text-gray-700">Subconcepts:</p>
            {subconcepts.map((subconcept) => {
              if (!subconcept) return null;

              // Handle different naming conventions
              const subconceptName =
                subconcept.name || subconcept.title || "Unnamed Subconcept";
              const subconceptId =
                subconcept.id ||
                `subconcept_${subconceptName
                  .toLowerCase()
                  .replace(/\s+/g, "_")}`;

              // Normalize subconcept properties
              const subDefinition = Array.isArray(subconcept.definition)
                ? subconcept.definition.join("\n")
                : subconcept.definition || "";
              const subFormulae = Array.isArray(subconcept.formulae)
                ? subconcept.formulae
                : subconcept.formulae
                ? [subconcept.formulae]
                : [];
              const subExamples = Array.isArray(subconcept.examples)
                ? subconcept.examples
                : subconcept.examples
                ? [subconcept.examples]
                : [];

              return (
                <div key={subconceptId} className="mt-2 ml-2">
                  <h6 className="text-sm font-medium">{subconceptName}</h6>
                  {subDefinition && (
                    <p className="text-xs text-gray-600">
                      <ReactMarkdown
                        remarkPlugins={[remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                      >
                        {subDefinition}
                      </ReactMarkdown>
                    </p>
                  )}

                  {subFormulae.length > 0 && (
                    <div className="mt-1">
                      <p className="text-xs font-medium text-gray-700">
                        Formulae:
                      </p>
                      <ul className="list-disc list-inside ml-2">
                        {subFormulae.map((formula, idx) => (
                          <li
                            key={idx}
                            className="text-xs text-gray-600 font-mono bg-gray-50 p-1 my-1 rounded"
                          >
                            <InlineMath math={renderFormulae(formula)} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {subExamples.length > 0 && (
                    <div className="mt-1">
                      <p className="text-xs font-medium text-gray-700">
                        Examples:
                      </p>
                      <ul className="list-disc list-inside ml-2">
                        {subExamples.map((example, idx) => (
                          <li key={idx} className="text-xs text-gray-600">
                            <ReactMarkdown
                              remarkPlugins={[remarkMath]}
                              rehypePlugins={[rehypeKatex]}
                            >
                              {example}
                            </ReactMarkdown>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-2 text-xs text-gray-400 flex justify-between">
          <span>
            Page: {pageNumbers.length > 0 ? pageNumbers.join(", ") : "N/A"}
          </span>
          <span>ID: {conceptId}</span>
        </div>
      </div>
    );
  };

  // Normalize and validate the structured data
  const normalizeAndValidateData = (resultData) => {
    // Add debug logging
    console.log("===== NORMALIZE AND VALIDATE DATA =====");
    console.log("Raw result object:", resultData);
    console.log("Has structuredData:", !!resultData.structuredData);

    // Check if result has structuredData
    if (!resultData.structuredData) {
      return null;
    }

    // Try to normalize the data structure if it doesn't match expected format
    let normalizedData = resultData.structuredData;

    console.log("Normalizing data structure...");

    // If structuredData doesn't have topics property but has other properties that might be topics
    if (!normalizedData.topics) {
      console.log("No topics property found, attempting to normalize");

      // Case 1: If structuredData is an array, treat it as topics
      if (Array.isArray(normalizedData)) {
        console.log("structuredData is an array, treating as topics");
        normalizedData = { topics: normalizedData };
      }
      // Case 2: If structuredData has properties that might be topics (like subject areas)
      else if (typeof normalizedData === "object") {
        // Look for properties that might contain topic arrays
        const possibleTopicArrays = Object.entries(normalizedData).filter(
          ([key, value]) =>
            Array.isArray(value) &&
            value.length > 0 &&
            typeof value[0] === "object"
        );

        console.log(
          "Possible topic arrays found:",
          possibleTopicArrays.map(([key]) => key)
        );

        if (possibleTopicArrays.length > 0) {
          // Use the first array property as topics
          const [key, value] = possibleTopicArrays[0];
          normalizedData = { topics: value };
          console.log(`Using '${key}' property as topics array`);
        }
        // Case 3: The object itself might be a single topic
        else if (normalizedData.title || normalizedData.name) {
          console.log(
            "Object appears to be a single topic, wrapping as topics array"
          );
          normalizedData = {
            topics: [normalizedData],
          };
        }
      }
    } else {
      console.log(
        "Found topics property with length:",
        normalizedData.topics.length
      );
    }

    // If we still don't have a topics array, or it's empty
    if (
      !normalizedData.topics ||
      !Array.isArray(normalizedData.topics) ||
      normalizedData.topics.length === 0
    ) {
      console.log("Failed to normalize data structure");
      return null;
    }

    console.log("Final normalized data for rendering:");
    console.log("Topics count:", normalizedData.topics.length);
    if (normalizedData.topics.length > 0) {
      const firstTopic = normalizedData.topics[0];
      console.log("First topic:", firstTopic.title || firstTopic.name);
      console.log("First topic has subtopics:", !!firstTopic.subtopics);
      if (firstTopic.subtopics && firstTopic.subtopics.length > 0) {
        console.log("Subtopics count:", firstTopic.subtopics.length);
      }
    }
    console.log("===== END NORMALIZE AND VALIDATE DATA =====");

    return normalizedData;
  };

  // Main render function
  const normalizedData = normalizeAndValidateData(result);

  if (!normalizedData) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <p className="text-yellow-600">
          The response doesn't contain properly structured data. Please see the
          raw response tab.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-lg font-semibold text-gray-800">
          Structured Notes
        </h4>
        <div className="flex gap-2">
          <button
            onClick={() => setDebugMode(!debugMode)}
            className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            {debugMode ? "Hide Debug Info" : "Show Debug Info"}
          </button>
          <button
            onClick={() => onGenerateQuiz(result)}
            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors flex items-center"
          >
            <FiEdit className="mr-1" /> Generate Quiz
          </button>
        </div>
      </div>

      {debugMode && (
        <div className="mb-4 p-3 bg-gray-100 border border-gray-300 rounded text-xs overflow-auto max-h-60">
          <h5 className="font-medium mb-1">Structure Debug:</h5>
          <pre>{JSON.stringify(normalizedData, null, 2)}</pre>
        </div>
      )}

      {normalizedData.topics.map((topic) => renderTopic(topic))}
    </div>
  );
};

export default StructuredNotes;
