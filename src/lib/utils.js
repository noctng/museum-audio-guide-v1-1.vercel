import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// Thêm hàm này từ Layout.js của bạn
export const createPageUrl = (pageName) => {
  if (pageName === 'Index') return '/';
  return `/${pageName.toLowerCase()}`;
};