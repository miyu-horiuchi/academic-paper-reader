"use client";

import { useEffect, useState } from "react";
import { readAiSettings, type AiSettings } from "./ai-settings";

export function useAiSettings(): AiSettings | null {
  const [settings, setSettings] = useState<AiSettings | null>(null);
  useEffect(() => {
    setSettings(readAiSettings());
    const onChange = () => setSettings(readAiSettings());
    window.addEventListener("papers:ai-settings-changed", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("papers:ai-settings-changed", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);
  return settings;
}
