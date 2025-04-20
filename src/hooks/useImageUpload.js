import { useState } from "react";
import { processImageWithGemini } from "../service/geminiService";

/**
 * Custom hook for handling image uploads and processing with Gemini
 * @returns {Object} Image upload state and handlers
 */
const useImageUpload = () => {
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");

  /**
   * Handles file selection and creates image previews
   * @param {Event} e - The file input change event
   */
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);

    // Preview the images
    const newImages = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
      size: (file.size / 1024).toFixed(2) + " KB",
      status: "pending",
    }));

    setImages([...images, ...newImages]);
  };

  /**
   * Removes an image from the selection
   * @param {number} index - The index of the image to remove
   */
  const removeImage = (index) => {
    const newImages = [...images];
    URL.revokeObjectURL(newImages[index].preview);
    newImages.splice(index, 1);
    setImages(newImages);
  };

  /**
   * Processes selected images with Gemini API
   * @param {Function} onResultsUpdated - Optional callback when results are updated
   * @returns {Promise<Array>} The results from processing
   */
  const processWithGemini = async (onResultsUpdated) => {
    if (images.length === 0) {
      setError("Please upload at least one image");
      return [];
    }

    setUploading(true);
    setError("");
    const newResults = [];
    const updatedImages = [...images];

    try {
      for (let i = 0; i < images.length; i++) {
        if (images[i].status === "complete") continue;

        updatedImages[i].status = "processing";
        setImages([...updatedImages]);

        // Call the Gemini API service
        const result = await processImageWithGemini(images[i].file);

        if (result.success) {
          newResults.push(result);
          updatedImages[i].status = "complete";

          // If there's a callback, call it with the updated results
          if (onResultsUpdated) {
            onResultsUpdated([...results, ...newResults]);
          }
        } else {
          setError(`Error processing ${images[i].name}: ${result.error}`);
          updatedImages[i].status = "error";
        }

        setImages([...updatedImages]);
      }

      const updatedResults = [...results, ...newResults];
      setResults(updatedResults);
      return updatedResults;
    } catch (err) {
      setError(
        "An error occurred while processing the images. Please try again."
      );
      console.error(err);
      return [];
    } finally {
      setUploading(false);
    }
  };

  /**
   * Resets the image upload state
   */
  const resetImageUpload = () => {
    // Clean up any object URLs
    images.forEach((image) => URL.revokeObjectURL(image.preview));
    setImages([]);
    setResults([]);
    setError("");
  };

  /**
   * Sets results directly (useful when loading from saved results)
   * @param {Array} newResults - The results to set
   */
  const setResultsDirectly = (newResults) => {
    setResults(newResults);
  };

  return {
    images,
    uploading,
    results,
    error,
    handleImageChange,
    removeImage,
    processWithGemini,
    resetImageUpload,
    setResultsDirectly,
    setError,
  };
};

export default useImageUpload;
