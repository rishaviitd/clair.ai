// Utility functions for handling LaTeX in the application

/**
 * Sanitizes LaTeX markup to fix common rendering issues
 * @param {string} text - The text containing LaTeX to sanitize
 * @returns {string} The sanitized text
 */
export const sanitizeLatex = (text) => {
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

/**
 * Enhanced function to fix LaTeX in quiz questions
 * @param {string} text - The text containing LaTeX to prepare for display
 * @returns {string} Properly formatted LaTeX
 */
export const prepareLatexContent = (text) => {
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
