import { useEffect, useRef } from "react";

export default function useQuizTimer({
  status,
  timeLimitSec,
  elapsedSeconds,
  onTick,
  onTimeout,
}) {
  const timeoutTriggeredRef = useRef(false);

  useEffect(() => {
    if (status !== "inProgress") {
      return undefined;
    }

    const interval = window.setInterval(() => {
      onTick?.();
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [status, onTick]);

  useEffect(() => {
    if (status !== "inProgress") {
      timeoutTriggeredRef.current = false;
      return;
    }
    if (!timeLimitSec || timeLimitSec <= 0) {
      return;
    }
    if (elapsedSeconds >= timeLimitSec && !timeoutTriggeredRef.current) {
      timeoutTriggeredRef.current = true;
      onTimeout?.();
    }
  }, [status, timeLimitSec, elapsedSeconds, onTimeout]);
}
