"use client";

import { useState, useCallback } from "react";

export function useShareImage() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateImage = useCallback(async () => {
    const el = document.getElementById("share-card");
    if (!el) return;

    setIsGenerating(true);
    try {
      // Make visible for capture (but still off-screen)
      el.style.display = "flex";

      const { domToPng } = await import("modern-screenshot");
      const dataUrl = await domToPng(el, {
        width: 1080,
        height: 1920,
        scale: 1,
      });

      // Trigger download
      const link = document.createElement("a");
      link.download = "hkiff50-plan.png";
      link.href = dataUrl;
      link.click();
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return { generateImage, isGenerating };
}
