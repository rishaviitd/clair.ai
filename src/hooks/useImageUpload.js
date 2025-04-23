import { useState, useCallback } from "react";
import {
  processImageWithGemini,
  processBatchImagesWithTwoStepGemini,
} from "../service/geminiService";

/**
 * Custom hook for handling image uploads and processing with two-step Gemini approach
 * @returns {Object} Image upload state and handlers
 */
const useImageUpload = () => {
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [extractedContent, setExtractedContent] = useState(""); // Store the extracted content from step 1

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
   * Processes selected images with the two-step Gemini API approach
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

          // Store the extracted content from the first step if available
          if (result.originalExtraction) {
            setExtractedContent(result.originalExtraction);
          }

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
   * Processes all selected images in batch mode with two-step Gemini API
   * This processes all images together rather than one by one
   *
   * @param {Function} onResultsUpdated - Optional callback when results are updated
   * @returns {Promise<Object>} The batch processing result
   */
  const processBatchWithGemini = async (onResultsUpdated) => {
    if (images.length === 0) {
      setError("Please upload at least one image");
      return null;
    }

    setUploading(true);
    setError("");
    const updatedImages = [...images];

    try {
      // Mark all images as processing
      updatedImages.forEach((img, index) => {
        if (img.status !== "complete") {
          updatedImages[index].status = "processing";
        }
      });
      setImages([...updatedImages]);

      // Get all image files to process in batch
      const imageFiles = images
        .filter((img) => img.status !== "complete")
        .map((img) => img.file);

      if (imageFiles.length === 0) {
        setError("All images have already been processed");
        return null;
      }

      // Call the batch processing service
      const result = await processBatchImagesWithTwoStepGemini(imageFiles);

      if (result.success) {
        // Mark all processed images as complete
        updatedImages.forEach((img, index) => {
          if (updatedImages[index].status === "processing") {
            updatedImages[index].status = "complete";
          }
        });
        setImages([...updatedImages]);

        // Store the extracted content from the batch process
        if (result.originalExtraction) {
          setExtractedContent(result.originalExtraction);
        }

        // Add the batch result to our results
        const updatedResults = [...results, result];
        setResults(updatedResults);

        // If there's a callback, call it with the updated results
        if (onResultsUpdated) {
          onResultsUpdated(updatedResults);
        }

        return result;
      } else {
        setError(`Error processing batch: ${result.error}`);

        // Mark all processing images as error
        updatedImages.forEach((img, index) => {
          if (updatedImages[index].status === "processing") {
            updatedImages[index].status = "error";
          }
        });
        setImages([...updatedImages]);

        return null;
      }
    } catch (err) {
      setError(
        "An error occurred while batch processing the images. Please try again."
      );
      console.error(err);
      return null;
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
    setExtractedContent("");
  };

  /**
   * Sets results directly (useful when loading from saved results)
   * @param {Array} newResults - The results to set
   */
  const setResultsDirectly = (newResults) => {
    setResults(newResults);

    // If this is a two-step result, also set the extracted content
    if (
      newResults &&
      newResults.length > 0 &&
      newResults[0].originalExtraction
    ) {
      setExtractedContent(newResults[0].originalExtraction);
    }
  };

  /**
   * Sets images directly (useful when restoring state)
   * @param {Array} newImages - The images to set
   */
  const setImagesDirectly = (newImages) => {
    setImages(newImages);
  };

  return {
    images,
    uploading,
    results,
    error,
    extractedContent,
    handleImageChange,
    removeImage,
    processWithGemini,
    processBatchWithGemini,
    resetImageUpload,
    setResultsDirectly,
    setError,
    setImagesDirectly,
  };
};

export default useImageUpload;
