import { useEffect } from "react";
import gsap from "gsap";

export default function useRegisterAnimations(cardRef, heroRef, badgeRef) {
  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    tl.from(badgeRef.current, {
      y: 20,
      scale: 0.7,
      rotate: -10,
      opacity: 0,
      duration: 0.6,
    })
      .from(
        heroRef.current?.querySelectorAll("h1, p"),
        {
          y: 28,
          opacity: 0,
          stagger: 0.1,
          duration: 0.75,
        },
        "-=0.3"
      )
      .from(
        cardRef.current,
        {
          y: 42,
          opacity: 0,
          duration: 0.7,
        },
        "-=0.35"
      )
      .from(
        cardRef.current?.querySelectorAll(
          ".auth-field, .primary-button, .auth-card__footer"
        ),
        {
          y: 24,
          opacity: 0,
          stagger: 0.07,
          duration: 0.55,
        },
        "-=0.4"
      );

    const floatTl = gsap.to(badgeRef.current, {
      y: "-=10",
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      duration: 2.2,
    });

    return () => {
      tl.kill();
      floatTl.kill();
    };
  }, [cardRef, heroRef, badgeRef]);
}
