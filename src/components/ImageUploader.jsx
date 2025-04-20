import React from "react";
import { FiBookOpen, FiImage, FiCheckCircle, FiX } from "react-icons/fi";

/**
 * Component for uploading and displaying selected images
 *
 * @param {Object} props
 * @param {Array} props.images - Array of image objects
 * @param {boolean} props.uploading - Whether upload is in progress
 * @param {string} props.error - Error message, if any
 * @param {Function} props.handleImageChange - Function to handle image selection
 * @param {Function} props.removeImage - Function to remove an image
 * @param {Function} props.processWithGemini - Function to process images with Gemini
 */
const ImageUploader = ({
  images,
  uploading,
  error,
  handleImageChange,
  removeImage,
  processWithGemini,
}) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="border-2 border-dashed border-indigo-300 rounded-lg p-8 flex flex-col items-center justify-center hover:border-indigo-500 transition-colors">
        <FiBookOpen className="text-indigo-500 text-4xl mb-4" />

        <p className="text-gray-600 mb-4 text-center">
          Drag and drop your handwritten notes here, or click to browse
        </p>

        <label className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors cursor-pointer flex items-center">
          <FiImage className="mr-2" />
          Browse Images
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="hidden"
          />
        </label>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md flex items-center">
          <FiX className="mr-2" /> {error}
        </div>
      )}

      {images.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-700">
            Selected Images
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {images.map((image, index) => (
              <div key={index} className="border rounded-md p-3 relative">
                <img
                  src={image.preview}
                  alt={`Preview ${index}`}
                  className="w-full h-32 object-cover rounded-md mb-2"
                />
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600 truncate max-w-[70%]">
                    {image.name}
                  </div>
                  <div className="text-xs text-gray-500">{image.size}</div>
                </div>

                <div className="absolute top-2 right-2 flex gap-2">
                  {image.status === "complete" && (
                    <FiCheckCircle className="text-green-500 bg-white rounded-full" />
                  )}
                  {image.status === "error" && (
                    <FiX className="text-red-500 bg-white rounded-full" />
                  )}
                  <button
                    onClick={() => removeImage(index)}
                    className="bg-white rounded-full p-1 text-red-500 hover:text-red-700 transition-colors"
                  >
                    <FiX />
                  </button>
                </div>

                {image.status === "processing" && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-md">
                    <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={processWithGemini}
            disabled={uploading}
            className={`mt-4 px-6 py-2 rounded-md w-full ${
              uploading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700"
            } text-white font-medium transition-colors`}
          >
            {uploading ? "Processing..." : "Analyze Notes with Gemini 2.5 Pro"}
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
