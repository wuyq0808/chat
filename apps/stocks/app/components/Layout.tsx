import React from "react";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header style={{ 
        backgroundColor: "#f8f9fa", 
        borderBottom: "1px solid #dee2e6",
        padding: "1rem 2rem"
      }}>
        <h1 style={{ margin: 0, fontSize: "1.5rem" }}>Stock Market Analysis</h1>
      </header>
      
      <main style={{ flex: 1, padding: "2rem" }}>
        {children}
      </main>
      
      <footer style={{ 
        backgroundColor: "#f8f9fa", 
        borderTop: "1px solid #dee2e6",
        padding: "1rem 2rem",
        textAlign: "center",
        color: "#6c757d"
      }}>
        <p style={{ margin: 0 }}>
          Stock data and analysis powered by Google Gemini AI
        </p>
      </footer>
    </div>
  );
}