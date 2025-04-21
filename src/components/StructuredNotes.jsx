import React from "react";
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
          <span>ID: {conceptId}</span>
        </div>
      </div>
    );
  };

  // Main render function
  const normalizedData = normalizeAndValidateData(result);

  if (!normalizedData) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <p className="text-yellow-600">
          The response doesn't contain properly structured data.
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
            onClick={() => onGenerateQuiz(result)}
            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors flex items-center"
          >
            <FiEdit className="mr-1" /> Generate Quiz
          </button>
        </div>
      </div>

      {normalizedData.topics.map((topic) => renderTopic(topic))}
    </div>
  );
};

// Helper function to normalize and validate data
const normalizeAndValidateData = (resultData) => {
  // Early return if no data or structuredData
  if (!resultData || !resultData.structuredData) {
    return null;
  }

  // Get the structured data
  const structuredData = resultData.structuredData;

  // If structured data is already in expected format with topics array
  if (structuredData.topics && Array.isArray(structuredData.topics)) {
    return structuredData;
  }

  // Handle case where structuredData might be the topics array directly
  if (Array.isArray(structuredData)) {
    return { topics: structuredData };
  }

  // Fallback: Create a normalized structure
  const normalizedData = {
    topics: [],
  };

  // Try to extract topics from different possible formats
  if (
    structuredData.notes_structure &&
    Array.isArray(structuredData.notes_structure)
  ) {
    normalizedData.topics = structuredData.notes_structure;
  }
  // If there's a content field with topics
  else if (
    structuredData.content &&
    Array.isArray(structuredData.content.topics)
  ) {
    normalizedData.topics = structuredData.content.topics;
  }
  // If there's a chapters or sections field
  else if (structuredData.chapters && Array.isArray(structuredData.chapters)) {
    normalizedData.topics = structuredData.chapters;
  } else if (
    structuredData.sections &&
    Array.isArray(structuredData.sections)
  ) {
    normalizedData.topics = structuredData.sections;
  }
  // If there are concepts directly at the top level
  else if (structuredData.concepts && Array.isArray(structuredData.concepts)) {
    // Create a single topic with these concepts
    normalizedData.topics = [
      {
        title: "Main Topic",
        subtopics: [
          {
            title: "Concepts",
            concepts: structuredData.concepts,
          },
        ],
      },
    ];
  }

  // If we couldn't extract topics in a meaningful way
  if (
    !Array.isArray(normalizedData.topics) ||
    normalizedData.topics.length === 0
  ) {
    return null;
  }

  return normalizedData;
};

export default StructuredNotes;
