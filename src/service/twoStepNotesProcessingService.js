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
import {
  getApiConfig,
  makeGeminiRequest,
  extractTextFromResponse,
} from "./utils/apiUtils";

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
 * @param {File} imageFile - The image file to extract content from
 * @param {string} apiKey - API key for Gemini
 * @param {string} endpoint - API endpoint URL
 * @returns {Promise<string>} - The extracted content
 */
const extractContentFromImage = async (imageFile, apiKey, endpoint) => {
  // Convert image to base64
  const base64Image = await fileToBase64(imageFile);

  const requestBody = {
    contents: [
      {
        parts: [
          { text: INITIAL_EXTRACTION_PROMPT },
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
  const data = await makeGeminiRequest(
    endpoint,
    apiKey,
    requestBody,
    "content extraction"
  );

  return extractTextFromResponse(data);
};

/**
 * Structures the content using Gemini API
 * @param {string} content - The content to structure
 * @param {string} apiKey - API key for Gemini
 * @param {string} endpoint - API endpoint URL
 * @param {boolean} useSchema - Whether to use schema for response
 * @returns {Promise<string>} - The structured markdown
 */
const structureContent = async (
  content,
  apiKey,
  endpoint,
  useSchema = false
) => {
  // Combine the extracted content with our structuring prompt
  const prompt = `${NOTES_STRUCTURING_PROMPT}\n\nHere is the content extracted from student's notes that needs to be structured according to the format above:\n\n${content}`;

  const requestBody = {
    contents: [
      {
        parts: [{ text: prompt }],
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
    requestBody.generationConfig.responseSchema = notesStructureSchema;
  }

  // Make API request for structuring
  const data = await makeGeminiRequest(
    endpoint,
    apiKey,
    requestBody,
    "content structuring"
  );

  return extractTextFromResponse(data);
};

/**
 * Process content and create a result object
 * @param {string} markdownContent - Structured markdown content
 * @param {string} fileName - Name for the file
 * @param {string} originalExtraction - Original extracted content
 * @param {number} pages - Number of pages processed
 * @returns {Promise<Object>} - The processed result
 */
const createAndStoreResult = async (
  markdownContent,
  fileName,
  originalExtraction,
  pages
) => {
  // If we couldn't get markdown content, return an error
  if (!markdownContent) {
    return {
      success: false,
      error: "Failed to generate structured notes",
    };
  }

  const processedResult = {
    success: true,
    markdown: markdownContent,
    fileName: fileName,
    originalExtraction: originalExtraction,
    pages: pages,
  };

  // Store the result in localStorage
  return storeAnalysisResult(processedResult);
};

/**
 * Core processing function that handles both single images and batches
 * @param {File|File[]} images - Single image file or array of image files
 * @param {string} [apiKey] - API key (optional)
 * @returns {Promise<Object>} - Processing result
 */
const processImages = async (images, apiKey) => {
  try {
    // Validate input
    if (!images) {
      throw new Error("No images provided for processing");
    }

    // Handle both single image and array of images
    const imageFiles = Array.isArray(images) ? images : [images];
    if (imageFiles.length === 0) {
      throw new Error("No images provided for processing");
    }

    // Get API configuration
    const { key, endpoint, modelVersion } = getApiConfig(apiKey);

    // Step 1: Extract content from each image
    const extractionPromises = imageFiles.map((imageFile) =>
      extractContentFromImage(imageFile, key, endpoint)
    );

    const extractedContents = await Promise.all(extractionPromises);

    // Combine content with page separators if multiple images
    const isBatch = imageFiles.length > 1;
    const combinedContent = isBatch
      ? extractedContents
          .map((content, index) => `--- PAGE ${index + 1} ---\n${content}`)
          .join("\n\n")
      : extractedContents[0];

    // Step 2: Structure the content
    const useSchema = modelVersion.includes("gemini-pro-2");
    const markdownContent = await structureContent(
      combinedContent,
      key,
      endpoint,
      useSchema
    );

    // Create filename
    const fileName = isBatch
      ? `Batch_${imageFiles.length}_pages`
      : imageFiles[0].name;

    // Store and return the result
    return createAndStoreResult(
      markdownContent,
      fileName,
      combinedContent,
      imageFiles.length
    );
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to process images with Gemini API",
    };
  }
};

/**
 * Processes multiple images in batch using the Gemini API
 * @param {File[]} imageFiles - Array of image files to process
 * @param {string} [apiKey] - Your Gemini API key (optional)
 * @returns {Promise<object>} - The processed result
 */
export const processBatchImagesWithTwoStepGemini = async (
  imageFiles,
  apiKey
) => {
  return processImages(imageFiles, apiKey);
};

/**
 * Processes a single image using the Gemini API in a two-step approach
 * @param {File} imageFile - The image file to process
 * @param {string} [apiKey] - Your Gemini API key (optional)
 * @returns {Promise<object>} - The processed result
 */
export const processImageWithTwoStepGemini = async (imageFile, apiKey) => {
  return processImages(imageFile, apiKey);
};

// Export processImageWithTwoStepGemini as processImageWithGemini alias
export const processImageWithGemini = processImageWithTwoStepGemini;
