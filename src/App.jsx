import React from "react";
import ImageUpload from "./pages/ImageUpload";
import NotFound from "./pages/NotFound";

function App() {
  // Simple router to handle 404 cases
  const path = window.location.pathname;

  // Render the main app for the root path, otherwise show 404
  const getComponent = () => {
    if (path === "/" || path === "") {
      return <ImageUpload />;
    } else {
      return <NotFound />;
    }
  };

  return <div className="min-h-screen bg-gray-100">{getComponent()}</div>;
}

export default App;
