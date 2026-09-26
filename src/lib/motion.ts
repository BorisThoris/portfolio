import { createContext, useContext } from "react";

// Homepage motion controls cover both CSS decoration and automatic video previews.
export const MotionContext = createContext(true);
export const useMotionEnabled = () => useContext(MotionContext);
