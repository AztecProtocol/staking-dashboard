import { useState, useEffect } from "react";

const FIRST_VISIT_KEY = "atp-staking-first-visit";

export function useFirstTimeVisitor() {
  const [isFirstVisit, setIsFirstVisit] = useState<boolean>(true);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    const hasVisited = localStorage.getItem(FIRST_VISIT_KEY);
    setIsFirstVisit(hasVisited === null);
    setIsLoaded(true);
  }, []);

  const markAsVisited = () => {
    localStorage.setItem(FIRST_VISIT_KEY, "true");
    setIsFirstVisit(false);
  };

  return {
    isFirstVisit: isFirstVisit && isLoaded,
    isLoaded,
    markAsVisited,
  };
}
