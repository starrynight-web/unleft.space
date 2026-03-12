import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function uniqueifySvgIds(svg: string, prefix: string) {
  const idPrefix = prefix.toLowerCase().replace(/[^a-z0-9]/g, '-');
  return svg
    .replace(/\bid="([^"]+)"/g, `id="${idPrefix}-$1"`)
    .replace(/\bfill="url\(#([^)]+)\)"/g, `fill="url(#${idPrefix}-$1)"`)
    .replace(/\bstroke="url\(#([^)]+)\)"/g, `stroke="url(#${idPrefix}-$1)"`)
    .replace(/\bmask="url\(#([^)]+)\)"/g, `mask="url(#${idPrefix}-$1)"`)
    .replace(/\bclip-path="url\(#([^)]+)\)"/g, `clip-path="url(#${idPrefix}-$1)"`)
    .replace(/\bfilter="url\(#([^)]+)\)"/g, `filter="url(#${idPrefix}-$1)"`)
    .replace(/\bxlink:href="#([^"]+)"/g, `xlink:href="#${idPrefix}-$1"`)
    .replace(/\bhref="#([^"]+)"/g, `href="#${idPrefix}-$1"`);
}
