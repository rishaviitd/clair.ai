/**
 * Utility functions for interacting with the Gemini API
 */

/**
 * Get API key and endpoint configurations
 * @param {string} [apiKey] - Optional API key parameter
 * @returns {Object} Configuration with key, endpoint, and modelVersion
 */
export const getApiConfig = (apiKey) => {
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

  return { key, endpoint, modelVersion };
};

/**
 * Make a request to the Gemini API
 * @param {string} endpoint - API endpoint
 * @param {string} apiKey - API key
 * @param {Object} requestBody - Request body
 * @param {string} errorContext - Context for error message
 * @returns {Promise<Object>} API response
 */
export const makeGeminiRequest = async (
  endpoint,
  apiKey,
  requestBody,
  errorContext
) => {
  const response = await fetch(`${endpoint}?key=${apiKey}`, {
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
      `API error in ${errorContext}: ${
        errorData.error?.message || response.statusText
      }`
    );
  }

  return await response.json();
};

/**
 * Extract text from Gemini API response
 * @param {Object} data - API response data
 * @returns {string} Extracted text
 */
export const extractTextFromResponse = (data) => {
  let extractedText = "";

  if (data.candidates && data.candidates[0]?.content?.parts) {
    extractedText = data.candidates[0].content.parts
      .filter((part) => part.text)
      .map((part) => part.text)
      .join("\n");
  }

  if (!extractedText) {
    throw new Error("Failed to extract content from the API response");
  }

  return extractedText;
};
