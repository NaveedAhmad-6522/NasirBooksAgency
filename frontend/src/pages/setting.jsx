

import { useEffect, useState } from "react";

export default function Settings() {
  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || "system"
  );

  useEffect(() => {
    const root = window.document.documentElement;

    const applyTheme = (t) => {
      if (t === "dark") {
        root.classList.add("dark");
      } else if (t === "light") {
        root.classList.remove("dark");
      } else {
        // system preference
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        if (prefersDark) root.classList.add("dark");
        else root.classList.remove("dark");
      }
    };

    applyTheme(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-2xl font-semibold mb-6">Settings</h1>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-5">
        <h2 className="text-lg font-medium mb-4">Appearance</h2>

        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="theme"
              value="light"
              checked={theme === "light"}
              onChange={(e) => setTheme(e.target.value)}
            />
            Light Mode
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="theme"
              value="dark"
              checked={theme === "dark"}
              onChange={(e) => setTheme(e.target.value)}
            />
            Dark Mode
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="theme"
              value="system"
              checked={theme === "system"}
              onChange={(e) => setTheme(e.target.value)}
            />
            System Default
          </label>
        </div>
      </div>
    </div>
  );
}