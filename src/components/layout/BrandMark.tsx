/** Simple tubing-and-drop brand mark, drawn inline so it stays crisp at any size. */
export function BrandMark({ size = 44 }: { size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="bg-brand-500 flex shrink-0 items-center justify-center rounded-xl shadow-[0_8px_20px_-10px_rgb(44_94_173/0.9)]"
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 40 40" width={size * 0.66} height={size * 0.66} fill="none">
        <path
          d="M11 4v9.5c0 5 3.5 8.5 8.5 8.5S28 25.5 28 30.5V36"
          stroke="#ffffff"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <circle cx="11" cy="4" r="2.4" fill="#ffffff" />
        <path
          d="M28 30.5c0 2.6 1.6 4.4 3.6 6.1a5 5 0 0 1-7.2 0c2-1.7 3.6-3.5 3.6-6.1Z"
          fill="#7ed0c9"
        />
      </svg>
    </span>
  )
}