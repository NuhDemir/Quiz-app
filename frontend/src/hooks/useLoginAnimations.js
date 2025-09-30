import { useEffect } from "react";
import gsap from "gsap";

export default function useLoginAnimations(cardRef, heroRef) {
  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    tl.from(heroRef.current?.querySelectorAll("h1, p"), {
      y: 30,
      opacity: 0,
      stagger: 0.12,
      duration: 0.8,
    })
      .from(
        cardRef.current,
        {
          y: 40,
          opacity: 0,
          duration: 0.7,
        },
        "-=0.4"
      )
      .from(
        cardRef.current?.querySelectorAll(
          ".auth-field, .primary-button, .auth-card__footer"
        ),
        {
          y: 24,
          opacity: 0,
          stagger: 0.08,
          duration: 0.55,
        },
        "-=0.45"
      );

    return () => {
      tl.kill();
    };
  }, [cardRef, heroRef]);
}
