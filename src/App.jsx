import React from "react";
import ImageUpload from "./pages/ImageUpload";
import NotFound from "./pages/NotFound";
import RawResponseView from "./pages/RawResponseView";
import MarkdownViewer from "./components/MarkdownViewer";

// const markdownContent = `
// # Trigonometry

// ## ASTC Rule

// > The ASTC (All Students Take Calculus) rule helps determine the sign of trigonometric functions in different quadrants.

// * **Quadrant I (0° - 90°):** All trigonometric functions are positive.
// * **Quadrant II (90° - 180°):** Sine (sin) and cosecant (csc) are positive.
// * **Quadrant III (180° - 270°):** Tangent (tan) and cotangent (cot) are positive.
// * **Quadrant IV (270° - 360°):** Cosine (cos) and secant (sec) are positive.

// ### Examples

// **Q:** Find the sign of the following using the ASTC Rule:

// * **i) sin 120°**
//   * Positive (+ve)
// * **ii) cos 120°**
//   * Negative (-ve)
// * **iii) sin 210°**
//   * Negative (-ve)
//   * $\\sin(210°) = \\sin(180° + 30°) = -\\sin(30°) = -\\frac{1}{2}$
// * **iv) tan 210°**
//   * Positive (+ve)
//   * $\\tan(210°) = \\tan(180° + 30°) = \\tan(30°) = \\frac{1}{\\sqrt{3}}$
// * **v) tan 315°**
//   * Negative (-ve)
//   * $\\tan(315°) = \\tan(270° + 45°) = -\\cot(45°) = -1$
// * **vi) cos 330°**
//   * Positive (+ve)
//   * $\\cos(330°) = \\cos(270° + 60°) = \\sin(60°) = \\frac{\\sqrt{3}}{2}$
// * **vii) sec 210°**
//   * Negative (-ve)

// ## Reduction Formula

// > The reduction formula helps to express trigonometric functions of angles greater than 90° in terms of angles between 0° and 90°.

// ### Rules/Steps:

// 1. Write the given angle in the format:
//    $$90° \\times n \\pm \\alpha$$
//    where $\\alpha \\leq 90°$ (Acute angle)

// ### Determining Function Change

// * **n (Multiplier of 90°)**
//   * **Even:**
//     * The trigonometric function remains the same (180°, 360°).
//   * **Odd:**
//     * The trigonometric function changes (90°, 270°).
//     * sin ↔ cos
//     * sec ↔ cosec
//     * tan ↔ cot

// ## Trigonometric Formulas

// ### Double Angle Formulas

// 1. **Sin 2A**
//    $$\\sin 2A = 2 \\sin A \\cdot \\cos A$$

// 2. **Cos 2A**
//    $$\\cos 2A = \\cos^2 A - \\sin^2 A = 2 \\cos^2 A - 1 = 1 - 2 \\sin^2 A$$

// 3. **tan 2A**
//    $$\\tan 2A = \\frac{2 \\tan A}{1 - \\tan^2 A}$$

// ### Half Angle Formulas

// 4. **1 + cos A**
//    $$1 + \\cos A = 2 \\cos^2(\\frac{A}{2})$$

// 5. **1 - cos A**
//    $$1 - \\cos A = 2 \\sin^2(\\frac{A}{2})$$

// ## Homework

// * Beginner box 1 to 6
// * Exercise 1: Question number 1 and 2

// # Calculus

// ## I. Physical Meaning of dy/dx

// * **Diagram:** (Description: A graph is shown with the y-axis and x-axis. A curve is drawn, and a secant line intersects the curve. Δx and Δy are labeled on the graph.)

// * **Slope:**
//   * Slope = $\\tan\\theta = \\frac{\\Delta y}{\\Delta x}$
//   * Slope of line PQ

// * **Average Rate of Change:**
//   * Average Rate of change of y with respect to x.

// * **Derivative:**
//   * As Δx tends to 0 ($\\Delta x \\rightarrow 0$)
//   * $$\\lim_{\\Delta x \\rightarrow 0} \\frac{\\Delta y}{\\Delta x} = \\frac{dy}{dx}$$
//     > "limit ka matlab hota h zero kar dete lana h"

// * **Concepts:**
//   * Differentiation, derivative
//   * Instantaneous Rate of Change of y with respect to x
// `;
function App() {
  // Simple router to handle paths
  const path = window.location.pathname;

  // Render the appropriate component based on the path
  const getComponent = () => {
    switch (path) {
      case "/":
      case "":
        return <ImageUpload />;
      case "/raw-response":
        // This component will be managed in ImageUpload
        return <ImageUpload initialView="raw-response" />;
      default:
        return <NotFound />;
    }
  };

  return <div className="min-h-screen bg-gray-100">{getComponent()}</div>;
  // return (
  //   <div className="p-6">
  //     <MarkdownViewer content={markdownContent} />
  //   </div>
  // );
}

export default App;
