import React, { useState, useEffect } from "react";
import {
  FiUpload,
  FiImage,
  FiCheckCircle,
  FiX,
  FiBookOpen,
  FiEdit,
  FiDatabase,
  FiList,
  FiArrowRight,
  FiArrowLeft,
  FiCheckSquare,
} from "react-icons/fi";
import {
  processImageWithGemini,
  getStoredAnalysisResults,
  generateQuizFromNotes,
  getStoredQuizzes,
} from "../service/geminiService";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import Latex from "react-latex-next";
import StructuredNotes from "../components/StructuredNotes";
import { parseQuizQuestions } from "../service/types/quizSchema";

const ImageUpload = () => {
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("structured"); // "structured" or "raw"
  const [savedResults, setSavedResults] = useState([]);
  const [view, setView] = useState("upload"); // "upload", "saved", "quiz"
  const [selectedResult, setSelectedResult] = useState(null);
  const [quizResult, setQuizResult] = useState(null);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);

  // Quiz interaction states
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [showAnswer, setShowAnswer] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);

  // Add a debug mode state
  const [debugMode, setDebugMode] = useState(false);

  // Load saved results and quizzes on component mount
  useEffect(() => {
    const loadSavedData = () => {
      const storedResults = getStoredAnalysisResults();
      setSavedResults(storedResults);

      // Check for existing quizzes
      const storedQuizzes = getStoredQuizzes();
      if (storedQuizzes.length > 0) {
        // Find the most recent quiz
        const latestQuiz = storedQuizzes.sort(
          (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        )[0];

        // If there's a recent quiz, set it as the current one
        if (latestQuiz) {
          setQuizResult(latestQuiz);
        }
      }
    };

    loadSavedData();
  }, []);

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

  const removeImage = (index) => {
    const newImages = [...images];
    URL.revokeObjectURL(newImages[index].preview);
    newImages.splice(index, 1);
    setImages(newImages);
  };

  const processWithGemini = async () => {
    if (images.length === 0) {
      setError("Please upload at least one image");
      return;
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

          // Update saved results
          setSavedResults((prev) => [result, ...prev]);
        } else {
          setError(`Error processing ${images[i].name}: ${result.error}`);
          updatedImages[i].status = "error";
        }

        setImages([...updatedImages]);
      }

      setResults([...results, ...newResults]);
    } catch (err) {
      setError(
        "An error occurred while processing the images. Please try again."
      );
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleGenerateQuiz = async (result) => {
    setGeneratingQuiz(true);
    setQuizResult(null);
    setError("");
    setSelectedResult(result);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setShowAnswer(false);
    setQuizCompleted(false);

    try {
      const quiz = await generateQuizFromNotes(result);
      if (quiz.success) {
        setQuizResult(quiz);
        setView("quiz");
      } else {
        setError(`Failed to generate quiz: ${quiz.error}`);
      }
    } catch (err) {
      setError("An error occurred while generating the quiz");
      console.error(err);
    } finally {
      setGeneratingQuiz(false);
    }
  };

  // Quiz navigation handlers
  const handleNextQuestion = () => {
    if (quizResult && quizResult.quizQuestions) {
      if (currentQuestionIndex < quizResult.quizQuestions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
        setShowAnswer(false);
      } else if (!quizCompleted) {
        setQuizCompleted(true);
      }
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
      setShowAnswer(false);
    }
  };

  const handleAnswerSelect = (questionId, answerId) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: answerId,
    }));
  };

  const toggleShowAnswer = () => {
    setShowAnswer((prev) => !prev);
  };

  // Render the structured data
  const renderStructuredResult = (result, index) => {
    return (
      <div key={index}>
        <StructuredNotes result={result} onGenerateQuiz={handleGenerateQuiz} />
      </div>
    );
  };

  // Render saved quizzes list
  const renderSavedQuizzes = () => {
    const savedQuizzes = getStoredQuizzes();

    return (
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-700">
          Saved Quizzes
        </h3>

        {savedQuizzes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No saved quizzes yet. Generate a quiz from your notes to get
            started.
          </div>
        ) : (
          <div className="space-y-4">
            {savedQuizzes.map((quiz) => (
              <div key={quiz.id} className="border rounded-md p-4 bg-white">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">
                      Quiz: {quiz.sourceData?.fileName || "Notes Analysis"}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {new Date(quiz.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setQuizResult(quiz);
                        setCurrentQuestionIndex(0);
                        setUserAnswers({});
                        setShowAnswer(false);
                        setQuizCompleted(false);
                        setView("quiz");
                      }}
                      className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition-colors"
                    >
                      Take Quiz
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Navigation menu
  const renderNavigation = () => (
    <div className="flex border-b border-gray-200 mb-6">
      <button
        className={`px-4 py-2 font-medium text-sm mr-2 flex items-center ${
          view === "upload"
            ? "text-indigo-600 border-b-2 border-indigo-600"
            : "text-gray-500 hover:text-gray-700"
        }`}
        onClick={() => setView("upload")}
      >
        <FiUpload className="mr-2" /> Upload & Analyze
      </button>
      <button
        className={`px-4 py-2 font-medium text-sm mr-2 flex items-center ${
          view === "saved"
            ? "text-indigo-600 border-b-2 border-indigo-600"
            : "text-gray-500 hover:text-gray-700"
        }`}
        onClick={() => setView("saved")}
      >
        <FiDatabase className="mr-2" /> Saved Analysis ({savedResults.length})
      </button>
      <button
        className={`px-4 py-2 font-medium text-sm mr-2 flex items-center ${
          view === "quizzes"
            ? "text-indigo-600 border-b-2 border-indigo-600"
            : "text-gray-500 hover:text-gray-700"
        }`}
        onClick={() => setView("quizzes")}
      >
        <FiList className="mr-2" /> Saved Quizzes ({getStoredQuizzes().length})
      </button>
      {quizResult && (
        <button
          className={`px-4 py-2 font-medium text-sm flex items-center ${
            view === "quiz"
              ? "text-indigo-600 border-b-2 border-indigo-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setView("quiz")}
        >
          <FiList className="mr-2" /> Current Quiz
        </button>
      )}
    </div>
  );

  // Render saved results list
  const renderSavedResults = () => (
    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-700">
        Saved Analysis Results
      </h3>

      {savedResults.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No saved analysis results yet. Upload and analyze some notes to get
          started.
        </div>
      ) : (
        <div className="space-y-4">
          {savedResults.map((result) => (
            <div key={result.id} className="border rounded-md p-4 bg-white">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium">
                    {result.fileName || "Analysis Result"}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {new Date(result.timestamp).toLocaleString()}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setResults([result]);
                      setView("upload");
                    }}
                    className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition-colors"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleGenerateQuiz(result)}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors flex items-center"
                    disabled={generatingQuiz}
                  >
                    <FiEdit className="mr-1" />
                    {generatingQuiz && result.id === selectedResult?.id
                      ? "Generating..."
                      : "Generate Quiz"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Improve sanitizeLatex function to better handle math expressions
  const sanitizeLatex = (text) => {
    if (!text) return "";

    // Remove any JSON escaping from the string
    let sanitized = text
      // Replace double backslashes with single backslashes
      .replace(/\\\\/g, "\\")
      // Fix common LaTeX commands that get over-escaped
      .replace(/\\sin/g, "\\sin")
      .replace(/\\cos/g, "\\cos")
      .replace(/\\tan/g, "\\tan")
      .replace(/\\frac/g, "\\frac")
      .replace(/\\sqrt/g, "\\sqrt")
      .replace(/\\circ/g, "\\circ")
      .replace(/\\cdot/g, "\\cdot")
      .replace(/\\int/g, "\\int")
      .replace(/\\sum/g, "\\sum")
      .replace(/\\pi/g, "\\pi")
      .replace(/\\theta/g, "\\theta")
      .replace(/\\alpha/g, "\\alpha")
      .replace(/\\beta/g, "\\beta")
      .replace(/\\gamma/g, "\\gamma")
      .replace(/\\delta/g, "\\delta")
      .replace(/\\Delta/g, "\\Delta")
      // Add more LaTeX symbols and functions
      .replace(/\\lambda/g, "\\lambda")
      .replace(/\\mu/g, "\\mu")
      .replace(/\\sigma/g, "\\sigma")
      .replace(/\\Sigma/g, "\\Sigma")
      .replace(/\\phi/g, "\\phi")
      .replace(/\\Phi/g, "\\Phi")
      .replace(/\\omega/g, "\\omega")
      .replace(/\\Omega/g, "\\Omega")
      .replace(/\\times/g, "\\times")
      .replace(/\\div/g, "\\div")
      .replace(/\\rightarrow/g, "\\rightarrow")
      .replace(/\\leftarrow/g, "\\leftarrow")
      .replace(/\\Rightarrow/g, "\\Rightarrow")
      .replace(/\\Leftarrow/g, "\\Leftarrow")
      .replace(/\\approx/g, "\\approx")
      .replace(/\\neq/g, "\\neq")
      .replace(/\\geq/g, "\\geq")
      .replace(/\\leq/g, "\\leq")
      .replace(/\\pm/g, "\\pm")
      .replace(/\\infty/g, "\\infty")
      .replace(/\\partial/g, "\\partial")
      .replace(/\\nabla/g, "\\nabla")
      .replace(/\\ln/g, "\\ln")
      .replace(/\\log/g, "\\log")
      .replace(/\\exp/g, "\\exp")
      // Fix more complex expressions
      .replace(/\\begin\{([^}]+)\}/g, "\\begin{$1}")
      .replace(/\\end\{([^}]+)\}/g, "\\end{$1}")
      .replace(/\_\{([^}]+)\}/g, "_{$1}")
      .replace(/\^\{([^}]+)\}/g, "^{$1}");

    // Fix inline math delimiters
    sanitized = sanitized.replace(/\\\$/g, "$");

    // Make sure all $ delimiters are properly paired
    let dollarCount = 0;
    let fixedText = "";
    for (let i = 0; i < sanitized.length; i++) {
      if (sanitized[i] === "$") dollarCount++;
      fixedText += sanitized[i];
    }

    // If we have an odd number of $ delimiters, add one at the end to balance
    if (dollarCount % 2 === 1) {
      fixedText += "$";
    }

    // Find math expressions and wrap them in $ delimiters if not already present
    // This regex looks for common LaTeX patterns
    const commonLatexPatterns = [
      "\\\\sin",
      "\\\\cos",
      "\\\\tan",
      "\\\\frac",
      "\\\\sqrt",
      "\\\\circ",
      "\\\\cdot",
      "\\\\int",
      "\\\\sum",
      "\\\\pi",
      "\\\\theta",
      "\\\\alpha",
      "\\\\beta",
      "\\\\gamma",
      "\\\\delta",
      "\\\\Delta",
      "\\\\lambda",
      "\\\\mu",
      "\\\\sigma",
      "\\\\Sigma",
      "\\\\phi",
      "\\\\Phi",
      "\\\\omega",
      "\\\\Omega",
      "\\\\times",
      "\\\\div",
      "\\\\rightarrow",
      "\\\\leftarrow",
      "\\\\Rightarrow",
      "\\\\Leftarrow",
      "\\\\approx",
      "\\\\neq",
      "\\\\geq",
      "\\\\leq",
      "\\\\pm",
      "\\\\infty",
      "\\\\partial",
      "\\\\nabla",
      "\\\\ln",
      "\\\\log",
      "\\\\exp",
      "\\\\begin\\{",
      "\\\\end\\{",
    ];

    const patternRegex = new RegExp(
      `\\b(${commonLatexPatterns.join("|")})([^$]*?)([\s.,;:])`,
      "g"
    );

    fixedText = fixedText.replace(
      patternRegex,
      function (match, command, content, ending) {
        // If not already in math mode, wrap it in $ delimiters
        if (match.indexOf("$") === -1) {
          return `$${command}${content}$${ending}`;
        }
        return match;
      }
    );

    // Handle equations split across multiple lines
    const lines = fixedText.split("\n");
    const processedLines = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      // Look for lines that appear to be equations (contain = sign and LaTeX commands)
      if (
        line.includes("=") &&
        commonLatexPatterns.some((pattern) =>
          new RegExp(pattern.replace(/\\\\/g, "\\")).test(line)
        )
      ) {
        if (line.indexOf("$") === -1) {
          // Line seems to be an equation but has no math delimiters
          processedLines.push(`$${line}$`);
        } else {
          processedLines.push(line);
        }
      } else {
        processedLines.push(lines[i]);
      }
    }

    return processedLines.join("\n");
  };

  // Render quiz view
  const renderQuizView = () => {
    if (!quizResult) {
      return (
        <div className="text-center py-8">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Generating quiz from your notes...</p>
        </div>
      );
    }

    // Add detailed logging for debugging quiz data structure
    console.log("===== RENDERING QUIZ VIEW =====");
    console.log("quizResult:", quizResult);
    console.log("Has structured quizQuestions:", !!quizResult.quizQuestions);

    if (quizResult.quizQuestions) {
      console.log("quizQuestions type:", typeof quizResult.quizQuestions);
      console.log("Is array:", Array.isArray(quizResult.quizQuestions));
      if (Array.isArray(quizResult.quizQuestions)) {
        console.log("quizQuestions length:", quizResult.quizQuestions.length);
        console.log(
          "First question sample:",
          quizResult.quizQuestions.length > 0
            ? JSON.stringify(quizResult.quizQuestions[0], null, 2)
            : "No questions"
        );
      }
    }

    // Use Zod schema to parse quiz questions from either quizResult.quizQuestions or quizResult.quiz
    let processedQuizQuestions = quizResult.quizQuestions;

    // If quizQuestions is missing or empty, try to parse from quiz text using Zod
    if (
      (!processedQuizQuestions ||
        !Array.isArray(processedQuizQuestions) ||
        processedQuizQuestions.length === 0) &&
      quizResult.quiz
    ) {
      console.log(
        "Attempting to parse quiz questions from quiz text using Zod schema"
      );

      try {
        // Use the Zod parseQuizQuestions function
        processedQuizQuestions = parseQuizQuestions(quizResult.quiz);
        console.log(
          `Successfully parsed ${processedQuizQuestions.length} questions using Zod schema`
        );

        // Store back to quizResult for future reference
        if (processedQuizQuestions.length > 0) {
          quizResult.quizQuestions = processedQuizQuestions;
        }
      } catch (error) {
        console.warn("Error parsing quiz questions with Zod:", error);
      }
    }

    // Verify that the questions are valid
    const hasValidQuizQuestions =
      processedQuizQuestions &&
      Array.isArray(processedQuizQuestions) &&
      processedQuizQuestions.length > 0;

    // If quiz doesn't have structured questions, show raw text
    if (!hasValidQuizQuestions) {
      return (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-indigo-700">Quiz</h3>
            <div className="text-sm text-gray-500">
              Based on: {quizResult.sourceData?.fileName || "Analysis"}
            </div>
          </div>

          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-300 rounded-md">
            <p className="text-yellow-800 font-medium">
              The quiz couldn't be displayed in an interactive format. Here's
              the raw quiz content:
            </p>

            <div className="mt-3">
              <button
                onClick={() => setDebugMode(!debugMode)}
                className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                {debugMode ? "Hide Debug Info" : "Show Debug Info"}
              </button>
            </div>

            {debugMode && (
              <div className="mt-3 p-3 bg-gray-100 border border-gray-300 rounded text-xs overflow-auto">
                <h5 className="font-medium mb-1">Raw Response Data:</h5>
                <pre className="overflow-auto max-h-60 bg-gray-50 p-2 rounded">
                  {JSON.stringify(quizResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
          <div className="mt-4 p-5 bg-white border border-gray-200 rounded-md shadow-sm">
            <ReactMarkdown
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex]}
            >
              {quizResult.quiz || "No quiz content available."}
            </ReactMarkdown>
          </div>
        </div>
      );
    }

    try {
      // Attempt to render the interactive quiz using structured data
      const questions = processedQuizQuestions;

      // Validate current question index
      if (
        currentQuestionIndex < 0 ||
        currentQuestionIndex >= questions.length
      ) {
        console.warn("Invalid question index, resetting to 0");
        setCurrentQuestionIndex(0);
      }

      const currentQuestion = questions[currentQuestionIndex] || questions[0];

      // Safety check for current question
      if (!currentQuestion) {
        console.error("No currentQuestion available");
        return (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="p-4 bg-red-50 border border-red-300 rounded-md">
              <p className="text-red-700">
                Error: Could not load quiz question data.
              </p>
              <button
                onClick={() => setView("saved")}
                className="mt-4 px-3 py-1 bg-blue-600 text-white rounded"
              >
                Return to Saved Analysis
              </button>
            </div>
          </div>
        );
      }

      // Enhanced function to fix LaTeX in quiz questions
      const prepareLatexContent = (text) => {
        if (!text) return "";

        // Ensure text is a string
        const textStr = String(text);

        // First run through sanitizeLatex
        let processed = sanitizeLatex(textStr);

        // Additional processing for LaTeX in quiz questions
        processed = processed
          // Fix escaped backslashes in LaTeX expressions
          .replace(/\\{2,}([a-zA-Z]+)/g, "\\$1")
          // Fix common LaTeX commands that get over-escaped
          .replace(/\\\\frac/g, "\\frac")
          .replace(/\\\\Delta/g, "\\Delta");

        return processed;
      };

      const userAnswer = userAnswers[currentQuestion.id];
      const isCorrect =
        currentQuestion.type === "mcq" &&
        userAnswer === currentQuestion.correctAnswer;
      const hasAnswered = userAnswer !== undefined;

      return (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-indigo-700">
              Quiz: {quizResult.sourceData?.fileName || "Notes Analysis"}
            </h3>
            <div className="flex items-center gap-2">
              <div className="text-sm font-medium text-gray-600">
                Question {currentQuestionIndex + 1} of {questions.length}
              </div>
              <button
                onClick={() => setDebugMode(!debugMode)}
                className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                {debugMode ? "Hide Raw Data" : "Show Raw Data"}
              </button>
            </div>
          </div>

          {debugMode && (
            <div className="mt-2 mb-4 p-3 bg-gray-100 border border-gray-300 rounded-md">
              <h5 className="text-sm font-medium text-gray-700 mb-1">
                Question Data:
              </h5>
              <pre className="text-xs overflow-auto max-h-60 bg-gray-50 p-2 rounded">
                {JSON.stringify(currentQuestion, null, 2)}
              </pre>
            </div>
          )}

          {quizCompleted ? (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-md p-6">
              <h4 className="text-lg font-medium text-green-800 mb-4">
                Quiz Completed!
              </h4>

              <div className="mb-4">
                <p className="text-green-700 mb-2">Your Score:</p>
                <div className="text-2xl font-bold">
                  {
                    Object.keys(userAnswers).filter((qId) => {
                      const q = questions.find((q) => q.id === qId);
                      return (
                        q?.type === "mcq" &&
                        userAnswers[qId] === q?.correctAnswer
                      );
                    }).length
                  }{" "}
                  / {questions.filter((q) => q?.type === "mcq").length} correct
                </div>
              </div>

              <button
                onClick={() => {
                  setCurrentQuestionIndex(0);
                  setQuizCompleted(false);
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                Review Questions
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Question */}
              <div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">
                    {currentQuestion.topic || "General"}
                  </span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                    {currentQuestion.type === "mcq"
                      ? "Multiple Choice"
                      : "Subjective"}
                  </span>
                </div>
                <h4 className="text-lg font-medium mt-1 mb-4 math-content">
                  <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                  >
                    {prepareLatexContent(currentQuestion.question)}
                  </ReactMarkdown>
                </h4>

                {/* MCQ Options */}
                {currentQuestion.type === "mcq" &&
                  currentQuestion.options &&
                  Array.isArray(currentQuestion.options) && (
                    <div className="space-y-3 mt-3">
                      {currentQuestion.options.length === 0 ? (
                        <div className="p-3 border border-yellow-300 bg-yellow-50 rounded-md">
                          <p className="text-yellow-700">
                            This question has no options available.
                          </p>
                        </div>
                      ) : (
                        currentQuestion.options.map((option) => (
                          <div
                            key={option.id || Math.random()}
                            onClick={() =>
                              !showAnswer &&
                              handleAnswerSelect(currentQuestion.id, option.id)
                            }
                            className={`p-3 border rounded-md cursor-pointer flex items-center ${
                              userAnswer === option.id
                                ? isCorrect
                                  ? "bg-green-50 border-green-300"
                                  : showAnswer
                                  ? "bg-red-50 border-red-300"
                                  : "bg-indigo-50 border-indigo-300"
                                : showAnswer &&
                                  option.id === currentQuestion.correctAnswer
                                ? "bg-green-50 border-green-300"
                                : "hover:bg-gray-50"
                            }`}
                          >
                            <div className="mr-3 font-medium">
                              {option.id?.toUpperCase() || "?"}
                            </div>
                            <div className="flex-1 math-content">
                              <ReactMarkdown
                                remarkPlugins={[remarkMath]}
                                rehypePlugins={[rehypeKatex]}
                              >
                                {prepareLatexContent(
                                  option.text || "No option text available"
                                )}
                              </ReactMarkdown>
                            </div>
                            {userAnswer === option.id && (
                              <FiCheckSquare
                                className={
                                  isCorrect
                                    ? "text-green-500"
                                    : "text-indigo-500"
                                }
                              />
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}

                {/* Subjective Question */}
                {currentQuestion.type === "subjective" && (
                  <div className="mt-3">
                    <textarea
                      placeholder="Write your answer here..."
                      value={userAnswer || ""}
                      onChange={(e) =>
                        handleAnswerSelect(currentQuestion.id, e.target.value)
                      }
                      disabled={showAnswer}
                      className="w-full p-3 border rounded-md min-h-32"
                    />
                  </div>
                )}

                {/* Explanation / Sample Answer */}
                {showAnswer && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <h5 className="font-medium text-blue-800 mb-2">
                      {currentQuestion.type === "mcq"
                        ? "Explanation"
                        : "Sample Answer"}
                    </h5>
                    <div className="text-blue-700 math-content">
                      <ReactMarkdown
                        remarkPlugins={[remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                      >
                        {prepareLatexContent(
                          currentQuestion.type === "mcq"
                            ? currentQuestion.explanation
                            : currentQuestion.sampleAnswer
                        )}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <button
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                  className={`px-3 py-1.5 flex items-center ${
                    currentQuestionIndex === 0
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-indigo-600 hover:text-indigo-800"
                  }`}
                >
                  <FiArrowLeft className="mr-1" /> Previous
                </button>

                <button
                  onClick={toggleShowAnswer}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  {showAnswer ? "Hide Answer" : "Show Answer"}
                </button>

                <button
                  onClick={handleNextQuestion}
                  className="px-3 py-1.5 text-indigo-600 hover:text-indigo-800 flex items-center"
                >
                  {currentQuestionIndex < questions.length - 1 ? (
                    <>
                      Next <FiArrowRight className="ml-1" />
                    </>
                  ) : (
                    "Finish Quiz"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      );
    } catch (error) {
      console.error("Error rendering quiz:", error);
      // Fallback to raw text display
      return (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-indigo-700">Quiz</h3>
            <div className="text-sm text-gray-500">
              Based on: {quizResult.sourceData?.fileName || "Analysis"}
            </div>
          </div>

          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md mb-4">
            <p className="text-yellow-700">
              There was an error displaying the interactive quiz (
              {error.message}). Showing raw content instead.
            </p>
          </div>

          <div className="mt-4 p-5 bg-white border border-gray-200 rounded-md shadow-sm">
            <ReactMarkdown
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex]}
            >
              {quizResult.quiz || "No quiz content available."}
            </ReactMarkdown>
          </div>
        </div>
      );
    }
  };

  // Upload and analyze view
  const renderUploadView = () => (
    <>
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
              {uploading
                ? "Processing..."
                : "Analyze Notes with Gemini 2.5 Pro"}
            </button>
          </div>
        )}
      </div>

      {results.length > 0 && (
        <div className="mt-8">
          <div className="flex border-b border-gray-200 mb-4">
            <button
              className={`px-4 py-2 font-medium text-sm mr-2 ${
                activeTab === "structured"
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("structured")}
            >
              Structured Notes
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm ${
                activeTab === "raw"
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("raw")}
            >
              Raw Response
            </button>
          </div>

          <div className="space-y-6">
            {results.map((result, index) => (
              <div key={index}>
                {activeTab === "structured" ? (
                  renderStructuredResult(result, index)
                ) : (
                  <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                    <pre className="text-xs text-gray-800 whitespace-pre-wrap overflow-auto max-h-96">
                      {result.description}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      {renderNavigation()}

      {view === "upload" && renderUploadView()}
      {view === "saved" && renderSavedResults()}
      {view === "quizzes" && renderSavedQuizzes()}
      {view === "quiz" && renderQuizView()}
    </div>
  );
};

export default ImageUpload;
