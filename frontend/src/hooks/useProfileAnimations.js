import { useCallback } from "react";
import { gsap } from "gsap";

const toArray = (target) => {
  if (!target) return [];
  if (Array.isArray(target)) return target.filter(Boolean);

  const isNodeList =
    typeof NodeList !== "undefined" && target instanceof NodeList;
  const isHTMLCollection =
    typeof HTMLCollection !== "undefined" && target instanceof HTMLCollection;

  if (isNodeList || isHTMLCollection) {
    return Array.from(target).filter(Boolean);
  }

  return [target];
};

export default function useProfileAnimations() {
  const animateHero = useCallback((target, options = {}) => {
    const [element] = toArray(target);
    if (!element) return null;

    return gsap.fromTo(
      element,
      {
        opacity: 0,
        y: 40,
        scale: 0.96,
        ...options.from,
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: options.duration ?? 0.9,
        ease: options.ease ?? "power3.out",
        delay: options.delay ?? 0,
        ...options.to,
      }
    );
  }, []);

  const revealMetrics = useCallback((targets, options = {}) => {
    const elements = toArray(targets);
    if (!elements.length) return null;

    gsap.set(elements, {
      opacity: 0,
      y: options.offset ?? 24,
      ...options.from,
    });

    return gsap.to(elements, {
      opacity: 1,
      y: 0,
      duration: options.duration ?? 0.7,
      ease: options.ease ?? "power3.out",
      stagger: options.stagger ?? 0.12,
      ...options.to,
    });
  }, []);

  const revealBadges = useCallback((targets, options = {}) => {
    const elements = toArray(targets);
    if (!elements.length) return null;

    gsap.set(elements, {
      opacity: 0,
      scale: options.fromScale ?? 0.9,
    });

    return gsap.to(elements, {
      opacity: 1,
      scale: 1,
      duration: options.duration ?? 0.5,
      ease: options.ease ?? "back.out(1.8)",
      stagger: options.stagger ?? 0.08,
    });
  }, []);

  const pulseHighlight = useCallback((targets, options = {}) => {
    const elements = toArray(targets);
    if (!elements.length) return null;

    return gsap.to(elements, {
      scale: options.scale ?? 1.02,
      duration: options.duration ?? 2,
      ease: options.ease ?? "sine.inOut",
      repeat: -1,
      yoyo: true,
      delay: options.delay ?? 0.4,
    });
  }, []);

  const fillProgressBar = useCallback((target, value, options = {}) => {
    const [element] = toArray(target);
    if (!element) return null;

    if (options.reset !== false) {
      gsap.set(element, { width: 0, ...options.from });
    }

    const resolvedValue =
      typeof value === "number"
        ? `${Math.max(0, Math.min(value, 100))}%`
        : value;

    return gsap.to(element, {
      width: resolvedValue,
      duration: options.duration ?? 0.9,
      ease: options.ease ?? "power3.out",
      ...options.to,
    });
  }, []);

  return {
    animateHero,
    revealMetrics,
    revealBadges,
    pulseHighlight,
    fillProgressBar,
  };
}
