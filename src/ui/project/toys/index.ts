import type { ComponentType } from "react";
import { CrashSwitch } from "../CrashSwitch";
import { DonutStudio } from "./DonutStudio";
import { IntegerFitToy } from "./IntegerFitToy";
import { WeightedDrawLab } from "./WeightedDrawLab";

// Projects that cannot run in a page but whose core can, faithfully: each toy ports
// the program's own logic (or shows its own footage) and says which it is.
const toys: Record<string, ComponentType> = {
  "dynamic-damage": CrashSwitch,
  helloword: DonutStudio,
  "weighted-draw-engine": WeightedDrawLab,
  "boris-rep": IntegerFitToy,
};

export const getToy = (slug: string) => toys[slug];
export const toySlugs = Object.keys(toys);
