
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
        .hegart-logo-path-orange { stroke: hsl(var(--accent)); } /* Light: Orange */
        .dark .hegart-logo-path-orange { stroke: hsl(var(--secondary)); } /* Dark: Darker Orange */

        .hegart-logo-path-black { stroke: hsl(var(--foreground)); } /* Light: Dark Gray/Black */
        .dark .hegart-logo-path-black { stroke: hsl(var(--primary-foreground)); } /* Dark: Almost White */
      `}</style>
      <rect width="100" height="100" rx="8" fill="currentColor" className="text-primary" />
       <path
        className="hegart-logo-path-orange"
        d="M20 80 Q 50 20 80 80"
        strokeWidth="5" /* Increased strokeWidth for better visibility */
        fill="none"
        opacity="0.9" /* Slightly increased opacity */
      />
       <path
        className="hegart-logo-path-black"
        d="M20 20 Q 50 80 80 20"
        strokeWidth="4" /* Increased strokeWidth */
        fill="none"
        opacity="0.8" /* Slightly increased opacity */
        strokeDasharray="6 4" /* Adjusted dasharray for different visual */
      />
    </svg>
  );
}

