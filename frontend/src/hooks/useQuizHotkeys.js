import { useEffect } from "react";

const INTERACTIVE_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT", "BUTTON"]);

export default function useQuizHotkeys({
  enabled,
  optionsLength,
  onSelectOption,
  onNext,
  onPrev,
  onToggleFlag,
}) {
  useEffect(() => {
    if (!enabled) return undefined;

    const handler = (event) => {
      if (event.defaultPrevented) return;

      const activeTag = event.target?.tagName;
      if (activeTag && INTERACTIVE_TAGS.has(activeTag)) {
        return;
      }

      switch (event.key) {
        case "ArrowRight":
          event.preventDefault();
          onNext?.();
          break;
        case "ArrowLeft":
          event.preventDefault();
          onPrev?.();
          break;
        case "Enter":
          if (event.shiftKey) {
            event.preventDefault();
            onPrev?.();
          } else {
            event.preventDefault();
            onNext?.();
          }
          break;
        case "f":
        case "F":
          event.preventDefault();
          onToggleFlag?.();
          break;
        default: {
          const digit = Number(event.key);
          if (Number.isInteger(digit) && digit >= 1 && digit <= optionsLength) {
            event.preventDefault();
            onSelectOption?.(digit - 1);
          }
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [enabled, optionsLength, onSelectOption, onNext, onPrev, onToggleFlag]);
}
