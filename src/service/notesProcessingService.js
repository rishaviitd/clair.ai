/**
 * Service to process notes images with Gemini API
 */

import { fileToBase64 } from "./utils/fileUtils";
import { storeAnalysisResult } from "./storageService";
import { NOTES_STRUCTURING_PROMPT } from "./prompts/notesPrompt";
import { notesStructureSchema } from "./types/notesSchema";

/**
 * Processes an image using the Gemini API
 * @param {File} imageFile - The image file to process
 * @param {string} [apiKey] - Your Gemini API key (optional if set in environment variables)
 * @returns {Promise<object>} - The processed result
 */
export const processImageWithGemini = async (imageFile, apiKey) => {
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

    // Check if we should try to use schema (based on model version)
    const useSchema = modelVersion.includes("gemini-pro-2"); // Only use schema with full release versions

    // Prepare request body with appropriate configuration
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: NOTES_STRUCTURING_PROMPT,
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

    // Add schema configuration only if using a compatible model
    if (useSchema) {
      requestBody.generationConfig.responseSchema = notesStructureSchema;
    }

    // Make API request
    const response = await fetch(`${endpoint}?key=${key}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `API error: ${errorData.error?.message || response.statusText}`
      );
    }

    const data = await response.json();

    // Add detailed console logging of the Gemini API response
    console.log("===== GEMINI API RESPONSE START =====");
    console.log("Raw API response structure:", Object.keys(data));
    console.log(
      "Candidates count:",
      data.candidates ? data.candidates.length : 0
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
          console.log("Text response received");
          console.log("Text sample:", rawText.substring(0, 200) + "...");

          // Try to parse JSON from the text response
          try {
            // Look for JSON in code blocks first
            const codeBlockMatch = rawText.match(
              /```(?:json)?\s*([\s\S]*?)\s*```/
            );
            if (codeBlockMatch && codeBlockMatch[1]) {
              jsonData = JSON.parse(codeBlockMatch[1]);
              console.log("Successfully extracted JSON from code block");
            }
            // Try direct JSON if no code blocks
            else {
              // Try to find JSON pattern with braces
              const objectMatch = rawText.match(/\{[\s\S]*\}/);
              if (objectMatch) {
                jsonData = JSON.parse(objectMatch[0]);
                console.log("Successfully extracted JSON object");
              }
            }
          } catch (e) {
            console.warn("Failed to parse JSON from text response:", e);
          }
        }
      }
    } catch (error) {
      console.warn("Error extracting response:", error);
    }

    // If no structured data, set the raw text for the result
    const result = rawText;

    // If we have valid JSON data, transform it to expected format
    if (jsonData) {
      console.log(
        "RAW JSON DATA STRUCTURE:",
        JSON.stringify(jsonData).substring(0, 1000)
      );

      // Transform the JSON structure if needed to fit the expected format for the UI
      let normalizedData = jsonData;

      // Check for the "notes_structure" format from the schema
      if (jsonData.notes_structure && Array.isArray(jsonData.notes_structure)) {
        console.log(
          "Detected 'notes_structure' format, normalizing to 'topics'"
        );
        console.log("Notes structure length:", jsonData.notes_structure.length);

        // Transform the structure to match what the UI expects
        const transformedTopics = jsonData.notes_structure.map((topic) => {
          const newTopic = {
            id: topic.id,
            title: topic.name,
            subtopics: [],
          };

          // Transform sub_items to subtopics if present
          if (Array.isArray(topic.sub_items)) {
            newTopic.subtopics = topic.sub_items.map((subtopic) => {
              const newSubtopic = {
                id: subtopic.id,
                title: subtopic.name,
                concepts: [],
              };

              // Transform sub_items to concepts if present
              if (Array.isArray(subtopic.sub_items)) {
                newSubtopic.concepts = subtopic.sub_items.map((concept) => {
                  return {
                    id: concept.id,
                    name: concept.name,
                    definition: concept.definition || "",
                    formulae: concept.formulae || [],
                    examples: concept.examples || [],
                    page_numbers: concept.page_numbers || [],
                    source_note_line: concept.source_note_line,
                  };
                });
              }

              return newSubtopic;
            });
          }

          return newTopic;
        });

        normalizedData = { topics: transformedTopics };
        console.log(
          "AFTER TRANSFORMATION - topics structure:",
          JSON.stringify(normalizedData.topics).substring(0, 500)
        );
      }
      // Handle direct array structure
      else if (!normalizedData.topics && Array.isArray(normalizedData)) {
        console.log(
          "Detected array without 'topics' property, wrapping as topics"
        );
        normalizedData = { topics: normalizedData };
      }

      const processedResult = {
        success: true,
        description: result,
        structuredData: normalizedData,
        fileName: imageFile.name,
      };

      // Store the result in localStorage
      return storeAnalysisResult(processedResult);
    } else {
      console.warn("No valid JSON structure found in Gemini response");
      const processedResult = {
        success: true,
        description: result,
        structuredData: null,
        fileName: imageFile.name,
      };

      // Store the result in localStorage
      return storeAnalysisResult(processedResult);
    }
  } catch (error) {
    console.error("Error processing image with Gemini:", error);
    return {
      success: false,
      error: error.message || "Failed to process image with Gemini API",
    };
  }
};
