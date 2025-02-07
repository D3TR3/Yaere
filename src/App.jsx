import React, { useEffect } from "react";

function App() {
  useEffect(() => {
    const createFloatingLine = () => {
      const container = document.querySelector(".floating-lines-container");
      if (!container) return;

      const line = document.createElement("div");
      line.className = "floating-line";
      line.style.left = `${Math.random() * 100}%`;
      line.style.animationDelay = `${Math.random() * 8}s`;
      container.appendChild(line);

      setTimeout(() => line.remove(), 15000);
    };

    const interval = setInterval(createFloatingLine, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div className="floating-lines-container" />
      {/* ...existing app content... */}
    </>
  );
}

export default App;
