/**
 * "Liquid glass" for small floating elements only (menu, top buttons, help window).
 * A soft blue tint, a light edge, a top highlight, and a blur of whatever is behind.
 * Blur is expensive on integrated graphics, so it is never used on the large panels.
 */
export const glass =
  'border border-white/15 bg-[#9cc4ff]/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.13),rgba(255,255,255,0.03))] ' +
  'shadow-[inset_0_1px_0_rgba(255,255,255,0.25),inset_0_-1px_0_rgba(255,255,255,0.05),0_18px_40px_-16px_rgba(0,0,0,0.7)] ' +
  'backdrop-blur-xl backdrop-saturate-150'

/** Same look with more tint, for windows that hold a lot of text. */
export const glassStrong =
  'border border-white/15 bg-[#0c2547]/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.10),rgba(255,255,255,0.02))] ' +
  'shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_28px_70px_-14px_rgba(0,0,0,0.85)] ' +
  'backdrop-blur-2xl backdrop-saturate-150'
