import React from "react";
import ImageUpload from "./pages/ImageUpload";
import NotFound from "./pages/NotFound";

function App() {
  // Simple router to handle paths
  const path = window.location.pathname;

  // Render the appropriate component based on the path
  const getComponent = () => {
    switch (path) {
      case "/":
      case "":
        return <ImageUpload />;
      default:
        return <NotFound />;
    }
  };

  return <div className="min-h-screen bg-gray-100">{getComponent()}</div>;
}

export default App;
