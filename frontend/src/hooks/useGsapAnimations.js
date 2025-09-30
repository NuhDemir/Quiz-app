import { useCallback } from "react";
import { gsap } from "gsap";

const noop = () => {};

const ensureArray = (target) => {
  if (!target) return [];
  if (Array.isArray(target)) return target;

  const isNodeList =
    typeof NodeList !== "undefined" && target instanceof NodeList;
  const isHTMLCollection =
    typeof HTMLCollection !== "undefined" && target instanceof HTMLCollection;

  if (isNodeList || isHTMLCollection) {
    return Array.from(target);
  }

  return [target];
};

export default function useGsapAnimations() {
  const createTimeline = useCallback(
    (config = {}) => gsap.timeline(config),
    []
  );

  const fadeIn = useCallback((target, options = {}) => {
    const elements = ensureArray(target);
    if (!elements.length) return noop();

    const { from = {}, to = {} } = options;

    gsap.set(elements, {
      opacity: 0,
      ...from,
    });

    return gsap.to(elements, {
      opacity: 1,
      duration: options.duration ?? 0.8,
      ease: options.ease ?? "power3.out",
      ...to,
    });
  }, []);

  const slideUp = useCallback((target, options = {}) => {
    const elements = ensureArray(target);
    if (!elements.length) return noop();

    const { offset = 24, from = {}, to = {} } = options;

    gsap.set(elements, { opacity: 0, y: offset, ...from });

    return gsap.to(elements, {
      opacity: 1,
      y: 0,
      duration: options.duration ?? 0.75,
      ease: options.ease ?? "power3.out",
      stagger: options.stagger ?? 0.08,
      ...to,
    });
  }, []);

  const staggerList = useCallback((target, options = {}) => {
    const elements = ensureArray(target);
    if (!elements.length) return noop();

    const { offset = 16, from = {}, to = {} } = options;

    gsap.set(elements, { opacity: 0, y: offset, ...from });

    return gsap.to(elements, {
      opacity: 1,
      y: 0,
      duration: options.duration ?? 0.6,
      ease: options.ease ?? "power2.out",
      stagger: options.stagger ?? 0.12,
      ...to,
    });
  }, []);

  const float = useCallback((target, options = {}) => {
    const elements = ensureArray(target);
    if (!elements.length) return noop();

    return gsap.to(elements, {
      y: options.y ?? -10,
      duration: options.duration ?? 2,
      ease: options.ease ?? "power1.inOut",
      yoyo: true,
      repeat: -1,
      ...options,
    });
  }, []);

  const animateWidth = useCallback((target, width, options = {}) => {
    const elements = ensureArray(target);
    if (!elements.length) return noop();

    return gsap.to(elements, {
      width,
      duration: options.duration ?? 0.8,
      ease: options.ease ?? "power3.out",
      ...options,
    });
  }, []);

  return {
    timeline: createTimeline,
    fadeIn,
    slideUp,
    staggerList,
    animateWidth,
    float,
  };
}
