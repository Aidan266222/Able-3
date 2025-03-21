// app/components/StreakCard.tsx
"use client";

import { Zap } from "lucide-react";
import React from "react";

interface Day {
  label: string;
  hasStreak: boolean;
}

// Example data – you can replace this with your real streak data.
const days: Day[] = [
  { label: "Sun", hasStreak: false },
  { label: "Mon", hasStreak: true },
  { label: "Tue", hasStreak: true },
  { label: "Wed", hasStreak: false },
  { label: "Thu", hasStreak: true },
  { label: "Fri", hasStreak: false },
  { label: "Sat", hasStreak: false },
];

export default function StreakCard() {
  const currentDayIndex = new Date().getDay();
  // Here, streakCount can be defined as you see fit.
  // In this demo, we simply count the days that have a streak.
  const streakCount = days.filter((day) => day.hasStreak).length;

  // Returns the Tailwind classes based on the day’s status.
  const getIconClasses = (hasStreak: boolean, isCurrent: boolean) => {
    if (hasStreak) {
      // Active streak: filled bolt (white) with orange border & background.
      return "bg-orange-500 border-orange-500 text-white";
    } else if (isCurrent) {
      // Current day without a streak: darker border outline.
      return "text-gray-600";
    } else {
      // No streak: lighter border and gray icon.
      return "text-gray-500";
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      {/* Header with Streak Counter */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-800">Current Streak</p>
          <p className="text-2xl font-bold text-gray-900">{streakCount} Days</p>
        </div>
        {/* The header bolt icon reflects today's streak status */}
        <div className={`p-2 border-2 rounded-full ${getIconClasses(
          days[currentDayIndex]?.hasStreak,
          true
        )}`}>
          <Zap className="w-6 h-6" />
        </div>
      </div>

      {/* Row of 7 Bolt Icons for the Days */}
      <div className="mt-4 flex justify-between">
        {days.map((day, index) => {
          const isCurrent = index === currentDayIndex;
          return (
            <div key={index} className="flex flex-col items-center">
              <div
                className={`p-2 rounded-full ${getIconClasses(
                  day.hasStreak,
                  isCurrent
                )}`}
              >
                <Zap className="w-4 h-4" />
              </div>
              <span className="mt-2 text-xs text-gray-600">{day.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
