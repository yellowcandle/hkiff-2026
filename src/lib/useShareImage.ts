"use client";

import { useState, useCallback } from "react";

export function useShareImage() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateImage = useCallback(async () => {
    const el = document.getElementById("share-card");
    if (!el) return;

    setIsGenerating(true);
    try {
      // Temporarily bring element into viewport for capture
      // (modern-screenshot needs the element to be renderable)
      const origLeft = el.style.left;
      const origZIndex = el.style.zIndex;
      const origPointerEvents = el.style.pointerEvents;
      el.style.left = "0px";
      el.style.zIndex = "-1";
      el.style.pointerEvents = "none";

      const { domToPng } = await import("modern-screenshot");
      const dataUrl = await domToPng(el, {
        width: 1080,
        height: 1920,
        scale: 1,
      });

      // Restore off-screen position
      el.style.left = origLeft;
      el.style.zIndex = origZIndex;
      el.style.pointerEvents = origPointerEvents;

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
