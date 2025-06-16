import { Link } from "react-router";
import type { MetaFunction } from "react-router";

export const meta: MetaFunction = () => {
  return [
    { title: "Page Not Found" },
    { name: "description", content: "The requested page could not be found" },
  ];
};

export default function CatchAll() {
  return (
    <div style={{ 
      fontFamily: "Inter, system-ui, Avenir, Helvetica, Arial, sans-serif", 
      padding: "2rem",
      textAlign: "center",
      maxWidth: "600px",
      margin: "0 auto"
    }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem", color: "#333" }}>
        Page Not Found
      </h1>
      <p style={{ fontSize: "1.1rem", marginBottom: "2rem", color: "#666" }}>
        The page you're looking for doesn't exist.
      </p>
      <Link 
        to="/" 
        style={{ 
          color: "#0066cc", 
          textDecoration: "none",
          fontSize: "1.1rem",
          fontWeight: "500"
        }}
      >
        ← Back to List
      </Link>
    </div>
  );
}