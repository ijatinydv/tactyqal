import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// let component variants combine tokens without conflicting tailwind overrides
export function cn(...values: ClassValue[]) {
  return twMerge(clsx(values));
}
