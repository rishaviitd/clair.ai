/**
 * Two-Step Service to process notes images with Gemini API
 * This implementation uses a two-phase approach:
 * 1. Extract content from the image
 * 2. Structure the extracted content according to our schema
 */

import { fileToBase64 } from "./utils/fileUtils";
import { storeAnalysisResult } from "./storageService";
import { NOTES_STRUCTURING_PROMPT } from "./prompts/notesPrompt";
import { notesStructureSchema } from "./types/notesSchema";

/**
 * Initial extraction prompt for the first step
 */
const INITIAL_EXTRACTION_PROMPT = `You are an expert assistant helping students with their handwritten NEET preparation notes. 
Your task is to extract the content from this image and provide a clear, structured representation of what the student has written.

Extract all the following elements that are visible in the image:
- Topic names
- Subtopic names
- Concept names/terms
- Definitions for concepts
- Mathematical formulas (convert to text or LaTeX format)
- Examples provided
- Any other important educational content

Provide this information in a structured format with clear headings and organization that reflects the hierarchical nature of the content.
Focus on maintaining the exact meaning of what the student wrote while making it more structured and readable.

Return the extracted content in a well-organized format that maintains the relationships between topics, subtopics, concepts, etc.`;

/**
 * Extracts content from a single image using Gemini API
 *
 * @param {File} imageFile - The image file to extract content from
 * @param {string} apiKey - API key for Gemini
 * @param {string} endpoint - API endpoint URL
 * @returns {Promise<string>} - The extracted content
 * @private
 */
const extractContentFromImage = async (imageFile, apiKey, endpoint) => {
  // Convert image to base64
  const base64Image = await fileToBase64(imageFile);

  const initialExtractionBody = {
    contents: [
      {
        parts: [
          {
            text: INITIAL_EXTRACTION_PROMPT,
          },
          {
            inline_data: {
              mime_type: imageFile.type,
              data: base64Image,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      topK: 32,
      topP: 0.95,
      maxOutputTokens: 65536,
    },
  };

  // Make API request
  const extractionResponse = await fetch(`${endpoint}?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(initialExtractionBody),
  });

  if (!extractionResponse.ok) {
    const errorData = await extractionResponse.json();
    throw new Error(
      `API error in content extraction: ${
        errorData.error?.message || extractionResponse.statusText
      }`
    );
  }

  const extractionData = await extractionResponse.json();

  // Extract the initial content
  let extractedContent = "";
  if (
    extractionData.candidates &&
    extractionData.candidates[0]?.content?.parts
  ) {
    extractedContent = extractionData.candidates[0].content.parts
      .filter((part) => part.text)
      .map((part) => part.text)
      .join("\n");
  }

  if (!extractedContent) {
    throw new Error("Failed to extract any content from the image");
  }

  return extractedContent;
};

/**
 * Structures the combined extracted content using Gemini API
 *
 * @param {string} combinedContent - The combined extracted content from all images
 * @param {string} apiKey - API key for Gemini
 * @param {string} endpoint - API endpoint URL
 * @param {boolean} useSchema - Whether to use schema for response
 * @returns {Promise<Object>} - The structured data
 * @private
 */
const structureContent = async (
  combinedContent,
  apiKey,
  endpoint,
  useSchema
) => {
  // Combine the extracted content with our structuring prompt
  const combinedPrompt = `${NOTES_STRUCTURING_PROMPT}\n\nHere is the content extracted from multiple pages of a student's notes that needs to be structured according to the format above. Consolidate all topics, subtopics, and concepts into a single coherent structure:\n\n${combinedContent}`;

  const structuringBody = {
    contents: [
      {
        parts: [
          {
            text: combinedPrompt,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      topK: 32,
      topP: 0.95,
      maxOutputTokens: 65536,
    },
  };

  // Add schema configuration only if using a compatible model
  if (useSchema) {
    structuringBody.generationConfig.responseSchema = notesStructureSchema;
  }

  // Make API request for structuring
  const structuringResponse = await fetch(`${endpoint}?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(structuringBody),
  });

  if (!structuringResponse.ok) {
    const errorData = await structuringResponse.json();
    throw new Error(
      `API error in structuring: ${
        errorData.error?.message || structuringResponse.statusText
      }`
    );
  }

  return await structuringResponse.json();
};

/**
 * Processes multiple images in batch using the Gemini API
 * First extracts content from each image individually, then combines and structures all content
 *
 * @param {File[]} imageFiles - Array of image files to process
 * @param {string} [apiKey] - Your Gemini API key (optional if set in environment variables)
 * @returns {Promise<object>} - The processed result
 */
export const processBatchImagesWithTwoStepGemini = async (
  imageFiles,
  apiKey
) => {
  try {
    if (!imageFiles || imageFiles.length === 0) {
      throw new Error("No images provided for processing");
    }

    // Use provided API key or fall back to environment variable
    const key = apiKey || import.meta.env.VITE_GEMINI_API_KEY;

    if (!key || key === "your_gemini_api_key_here") {
      throw new Error(
        "No valid API key provided. Please provide a Gemini API key."
      );
    }

    // API endpoint for Gemini - use configured model or fallback to default
    const modelVersion =
      import.meta.env.VITE_GEMINI_MODEL_VERSION ||
      "gemini-2.5-flash-preview-04-17";
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelVersion}:generateContent`;

    // Check if we should try to use schema (based on model version)
    const useSchema = modelVersion.includes("gemini-pro-2"); // Only use schema with full release versions

    // Step 1: Extract content from each image
    const extractionPromises = imageFiles.map((imageFile) =>
      extractContentFromImage(imageFile, key, endpoint)
    );

    const extractedContents = await Promise.all(extractionPromises);

    // Combine all extracted content into a single string with clear page separators
    const combinedContent = extractedContents
      .map((content, index) => `--- PAGE ${index + 1} ---\n${content}`)
      .join("\n\n");

    // Step 2: Structure the combined content
    const data = await structureContent(
      combinedContent,
      key,
      endpoint,
      useSchema
    );

    // Extract structured data if available
    let jsonData = null;
    let rawText = "";

    try {
      if (data.candidates && data.candidates[0]) {
        // Try to get text content
        if (
          data.candidates[0].content?.parts &&
          data.candidates[0].content.parts[0]?.text
        ) {
          rawText = data.candidates[0].content.parts[0].text;

          // Try to parse JSON from the text response
          try {
            // Look for JSON in code blocks first
            const codeBlockMatch = rawText.match(
              /```(?:json)?\s*([\s\S]*?)\s*```/
            );
            if (codeBlockMatch && codeBlockMatch[1]) {
              jsonData = JSON.parse(codeBlockMatch[1]);
            }
            // Try direct JSON if no code blocks
            else {
              // Try to find JSON pattern with braces
              const objectMatch = rawText.match(/\{[\s\S]*\}/);
              if (objectMatch) {
                jsonData = JSON.parse(objectMatch[0]);
              }
            }
          } catch (e) {
            // Parsing error, continue with raw text
          }
        }
      }
    } catch (error) {
      // Error extracting response, continue with what we have
    }

    // If no structured data, set the raw text for the result
    const result = rawText;

    // If we have valid JSON data, transform it to expected format
    if (jsonData) {
      // Transform the JSON structure if needed to fit the expected format for the UI
      let normalizedData = jsonData;

      // Check for the "notes_structure" format from the schema
      if (jsonData.notes_structure && Array.isArray(jsonData.notes_structure)) {
        // Transform the structure to match what the UI expects
        const transformedTopics = jsonData.notes_structure.map((topic) => {
          const topicName = topic.name || "Unnamed Topic";
          const slugifiedTopicId = topicName
            .toLowerCase()
            .replace(/\s+/g, "_")
            .replace(/[^\w-]+/g, "");

          const newTopic = {
            id: slugifiedTopicId,
            title: topicName,
            subtopics: [],
          };

          // Transform sub_items to subtopics if present
          if (Array.isArray(topic.sub_items)) {
            newTopic.subtopics = topic.sub_items.map((subtopic) => {
              const subtopicName = subtopic.name || "Unnamed Subtopic";
              const slugifiedSubtopicId = subtopicName
                .toLowerCase()
                .replace(/\s+/g, "_")
                .replace(/[^\w-]+/g, "");

              const newSubtopic = {
                id: slugifiedSubtopicId,
                title: subtopicName,
                concepts: [],
              };

              // Transform sub_items to concepts if present
              if (Array.isArray(subtopic.sub_items)) {
                newSubtopic.concepts = subtopic.sub_items.map((concept) => {
                  const conceptName = concept.name || "Unnamed Concept";
                  const slugifiedConceptId = conceptName
                    .toLowerCase()
                    .replace(/\s+/g, "_")
                    .replace(/[^\w-]+/g, "");

                  return {
                    id: slugifiedConceptId,
                    name: conceptName,
                    definition: concept.definition || "",
                    formulae: concept.formulae || [],
                    examples: concept.examples || [],
                  };
                });
              }

              return newSubtopic;
            });
          }

          return newTopic;
        });

        normalizedData = { topics: transformedTopics };
      }
      // Handle direct array structure
      else if (!normalizedData.topics && Array.isArray(normalizedData)) {
        normalizedData = { topics: normalizedData };
      }

      // Create a descriptive filename based on the number of pages
      const fileName =
        imageFiles.length === 1
          ? imageFiles[0].name
          : `Batch_${imageFiles.length}_pages`;

      const processedResult = {
        success: true,
        description: result,
        structuredData: normalizedData,
        fileName: fileName,
        originalExtraction: combinedContent, // Include the combined extraction
        pages: imageFiles.length,
      };

      // Store the result in localStorage
      return storeAnalysisResult(processedResult);
    } else {
      const fileName =
        imageFiles.length === 1
          ? imageFiles[0].name
          : `Batch_${imageFiles.length}_pages`;

      const processedResult = {
        success: true,
        description: result,
        structuredData: null,
        fileName: fileName,
        originalExtraction: combinedContent, // Include the combined extraction
        pages: imageFiles.length,
      };

      // Store the result in localStorage
      return storeAnalysisResult(processedResult);
    }
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to process images with Gemini API",
    };
  }
};

/**
 * Processes a single image using the Gemini API in a two-step approach:
 * 1. First extract the content from the image
 * 2. Then structure it according to the schema
 *
 * @param {File} imageFile - The image file to process
 * @param {string} [apiKey] - Your Gemini API key (optional if set in environment variables)
 * @returns {Promise<object>} - The processed result
 */
export const processImageWithTwoStepGemini = async (imageFile, apiKey) => {
  try {
    // Use provided API key or fall back to environment variable
    const key = apiKey || import.meta.env.VITE_GEMINI_API_KEY;

    if (!key || key === "your_gemini_api_key_here") {
      throw new Error(
        "No valid API key provided. Please provide a Gemini API key."
      );
    }

    // Convert image to base64
    const base64Image = await fileToBase64(imageFile);

    // API endpoint for Gemini - use configured model or fallback to default
    const modelVersion =
      import.meta.env.VITE_GEMINI_MODEL_VERSION ||
      "gemini-2.5-flash-preview-04-17";
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelVersion}:generateContent`;

    // Step 1: Initial content extraction from the image
    const initialExtractionBody = {
      contents: [
        {
          parts: [
            {
              text: INITIAL_EXTRACTION_PROMPT,
            },
            {
              inline_data: {
                mime_type: imageFile.type,
                data: base64Image,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        topK: 32,
        topP: 0.95,
        maxOutputTokens: 65536,
      },
    };

    // Make first API request
    const extractionResponse = await fetch(`${endpoint}?key=${key}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(initialExtractionBody),
    });

    if (!extractionResponse.ok) {
      const errorData = await extractionResponse.json();
      throw new Error(
        `API error in content extraction: ${
          errorData.error?.message || extractionResponse.statusText
        }`
      );
    }

    const extractionData = await extractionResponse.json();

    // Extract the initial content
    let extractedContent = "";
    if (
      extractionData.candidates &&
      extractionData.candidates[0]?.content?.parts
    ) {
      extractedContent = extractionData.candidates[0].content.parts
        .filter((part) => part.text)
        .map((part) => part.text)
        .join("\n");
    }

    if (!extractedContent) {
      throw new Error("Failed to extract any content from the image");
    }

    // Step 2: Structure the extracted content according to our schema
    const useSchema = modelVersion.includes("gemini-pro-2"); // Only use schema with full release versions

    // Combine the extracted content with our structuring prompt
    const combinedPrompt = `${NOTES_STRUCTURING_PROMPT}\n\nHere is the content extracted from a student's notes that needs to be structured according to the format above:\n\n${extractedContent}`;

    const structuringBody = {
      contents: [
        {
          parts: [
            {
              text: combinedPrompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        topK: 32,
        topP: 0.95,
        maxOutputTokens: 65536,
      },
    };

    // Add schema configuration only if using a compatible model
    if (useSchema) {
      structuringBody.generationConfig.responseSchema = notesStructureSchema;
    }

    // Make second API request for structuring
    const structuringResponse = await fetch(`${endpoint}?key=${key}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(structuringBody),
    });

    if (!structuringResponse.ok) {
      const errorData = await structuringResponse.json();
      throw new Error(
        `API error in structuring: ${
          errorData.error?.message || structuringResponse.statusText
        }`
      );
    }

    const data = await structuringResponse.json();

    // Extract structured data if available
    let jsonData = null;
    let rawText = "";

    try {
      if (data.candidates && data.candidates[0]) {
        // Try to get text content
        if (
          data.candidates[0].content?.parts &&
          data.candidates[0].content.parts[0]?.text
        ) {
          rawText = data.candidates[0].content.parts[0].text;

          // Try to parse JSON from the text response
          try {
            // Look for JSON in code blocks first
            const codeBlockMatch = rawText.match(
              /```(?:json)?\s*([\s\S]*?)\s*```/
            );
            if (codeBlockMatch && codeBlockMatch[1]) {
              jsonData = JSON.parse(codeBlockMatch[1]);
            }
            // Try direct JSON if no code blocks
            else {
              // Try to find JSON pattern with braces
              const objectMatch = rawText.match(/\{[\s\S]*\}/);
              if (objectMatch) {
                jsonData = JSON.parse(objectMatch[0]);
              }
            }
          } catch (e) {
            // Parsing error, continue with raw text
          }
        }
      }
    } catch (error) {
      // Error extracting response, continue with what we have
    }

    // If no structured data, set the raw text for the result
    const result = rawText;

    // If we have valid JSON data, transform it to expected format
    if (jsonData) {
      // Transform the JSON structure if needed to fit the expected format for the UI
      let normalizedData = jsonData;

      // Check for the "notes_structure" format from the schema
      if (jsonData.notes_structure && Array.isArray(jsonData.notes_structure)) {
        // Transform the structure to match what the UI expects
        const transformedTopics = jsonData.notes_structure.map((topic) => {
          const topicName = topic.name || "Unnamed Topic";
          const slugifiedTopicId = topicName
            .toLowerCase()
            .replace(/\s+/g, "_")
            .replace(/[^\w-]+/g, "");

          const newTopic = {
            id: slugifiedTopicId,
            title: topicName,
            subtopics: [],
          };

          // Transform sub_items to subtopics if present
          if (Array.isArray(topic.sub_items)) {
            newTopic.subtopics = topic.sub_items.map((subtopic) => {
              const subtopicName = subtopic.name || "Unnamed Subtopic";
              const slugifiedSubtopicId = subtopicName
                .toLowerCase()
                .replace(/\s+/g, "_")
                .replace(/[^\w-]+/g, "");

              const newSubtopic = {
                id: slugifiedSubtopicId,
                title: subtopicName,
                concepts: [],
              };

              // Transform sub_items to concepts if present
              if (Array.isArray(subtopic.sub_items)) {
                newSubtopic.concepts = subtopic.sub_items.map((concept) => {
                  const conceptName = concept.name || "Unnamed Concept";
                  const slugifiedConceptId = conceptName
                    .toLowerCase()
                    .replace(/\s+/g, "_")
                    .replace(/[^\w-]+/g, "");

                  return {
                    id: slugifiedConceptId,
                    name: conceptName,
                    definition: concept.definition || "",
                    formulae: concept.formulae || [],
                    examples: concept.examples || [],
                  };
                });
              }

              return newSubtopic;
            });
          }

          return newTopic;
        });

        normalizedData = { topics: transformedTopics };
      }
      // Handle direct array structure
      else if (!normalizedData.topics && Array.isArray(normalizedData)) {
        normalizedData = { topics: normalizedData };
      }

      const processedResult = {
        success: true,
        description: result,
        structuredData: normalizedData,
        fileName: imageFile.name,
        originalExtraction: extractedContent, // Include the original extraction for reference
        pages: 1,
      };

      // Store the result in localStorage
      return storeAnalysisResult(processedResult);
    } else {
      const processedResult = {
        success: true,
        description: result,
        structuredData: null,
        fileName: imageFile.name,
        originalExtraction: extractedContent, // Include the original extraction even if structuring failed
        pages: 1,
      };

      // Store the result in localStorage
      return storeAnalysisResult(processedResult);
    }
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to process image with Gemini API",
    };
  }
};
