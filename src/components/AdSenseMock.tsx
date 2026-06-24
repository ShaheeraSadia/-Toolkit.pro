import React from "react";

interface AdSenseMockProps {
  slot: string;
  type: "leaderboard" | "rectangle" | "responsive";
  className?: string;
}

export default function AdSenseMock({ slot, type, className = "" }: AdSenseMockProps) {
  return null;
}

