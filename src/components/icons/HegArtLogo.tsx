
import type { SVGProps } from 'react';

export function HegArtLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      aria-label="HegArt Logo"
      {...props}
    >
      <style>{`
        /* Background Rectangle Styling */
        .hegart-logo-rect {
          fill: hsl(var(--foreground)); /* Light Mode: Black background */
        }
        .dark .hegart-logo-rect {
          fill: hsl(var(--primary)); /* Dark Mode: Orange background (original primary for dark) */
        }

        /* Curve 1 (was originally 'orange' path) */
        .hegart-logo-path-curve1 {
          stroke: hsl(var(--accent)); /* Light Mode: Orange */
        }
        .dark .hegart-logo-path-curve1 {
          stroke: hsl(var(--secondary)); /* Dark Mode: Darker Orange (original behavior) */
        }

        /* Curve 2 (was originally 'black' path) */
        .hegart-logo-path-curve2 {
          stroke: hsl(var(--accent)); /* Light Mode: Orange */
        }
        .dark .hegart-logo-path-curve2 {
          stroke: hsl(var(--primary-foreground)); /* Dark Mode: Almost White (original behavior) */
        }
      `}</style>
      <rect width="100" height="100" rx="8" className="hegart-logo-rect" />
       <path
        className="hegart-logo-path-curve1"
        d="M20 80 Q 50 20 80 80"
        strokeWidth="5"
        fill="none"
        opacity="0.9"
      />
       <path
        className="hegart-logo-path-curve2"
        d="M20 20 Q 50 80 80 20"
        strokeWidth="4"
        fill="none"
        opacity="0.8"
        strokeDasharray="6 4"
      />
    </svg>
  );
}
