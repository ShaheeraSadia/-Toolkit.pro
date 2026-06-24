//import React from "react";

//interface AdSenseMockProps {
//  slot: string;
//  type: "leaderboard" | "rectangle" | "responsive";
//  className?: string;
//}

//export default function AdSenseMock({ slot, type, className = "" }: AdSenseMockProps) {
//  return null;
//}
import React from "react";

interface AdSenseMockProps {
  slot: string;
  type: "leaderboard" | "rectangle" | "responsive";
  className?: string;
}

// Map dimensions based on common ad unit types
const dimensions = {
  leaderboard: { width: "728px", height: "90px" },
  rectangle: { width: "300px", height: "250px" },
  responsive: { width: "100%", height: "auto", minHeight: "280px" },
};

export default function AdSenseMock({ slot, type, className = "" }: AdSenseMockProps) {
  const style = dimensions[type];

  // Render a clean, non-intrusive layout box for development/testing
  return (
    <div
      className={`adsense-mock-container ${className}`}
      style={{
        ...style,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f3f4f6",
        border: "1px dashed #d1d5db",
        borderRadius: "4px",
        color: "#6b7280",
        fontFamily: "monospace",
        fontSize: "12px",
        margin: "16px auto",
        padding: "8px",
        boxSizing: "border-box",
      }}
    >
      <span style={{ fontWeight: "bold", marginBottom: "4px" }}>
        [ Ad Placeholder ]
      </span>
      <span>Type: {type}</span>
      <span>Slot: {slot}</span>
    </div>
  );
}
