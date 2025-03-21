// app/components/ToggleSwitch.tsx
"use client";

import React from "react";

interface ToggleSwitchProps {
  enabled: boolean;
  setEnabled: (value: boolean) => void;
  label: string;
}

export default function ToggleSwitch({
  enabled,
  setEnabled,
  label,
}: ToggleSwitchProps) {
  return (
    <div className="flex items-center">
      <span className="mr-2 text-gray-700">{label}</span>
      <button
        type="button"
        onClick={() => setEnabled(!enabled)}
        className={`${
          enabled ? "bg-blue-600" : "bg-gray-300"
        } relative inline-flex items-center h-6 w-11 rounded-full transition-colors focus:outline-none`}
      >
        <span className="sr-only">{label}</span>
        <span
          className={`${
            enabled ? "translate-x-6" : "translate-x-1"
          } inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
        />
      </button>
    </div>
  );
}
