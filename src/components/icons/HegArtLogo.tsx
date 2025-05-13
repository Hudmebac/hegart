
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
        .dark .hegart-logo-path-black { stroke: hsl(var(--primary-foreground)); } /* Dark: Dark Gray/Black */
      `}</style>
      <rect width="100" height="100" rx="8" fill="currentColor" className="text-primary" />
      <text
        x="50%"
        y="50%"
        dy=".3em"
        textAnchor="middle"
        fontFamily="Montserrat, sans-serif"
        fontSize="10"
        fontWeight="bold"
        fill="hsl(var(--primary-foreground))"
        className="uppercase tracking-wider"
      >
        <tspan x="50%" dy="-0.6em">#Heg</tspan>
        <tspan x="50%" dy="1.2em">Art</tspan>
      </text>
       <path
        className="hegart-logo-path-orange"
        d="M20 80 Q 50 20 80 80"
        strokeWidth="3"
        fill="none"
        opacity="0.8"
      />
       <path
        className="hegart-logo-path-black"
        d="M20 20 Q 50 80 80 20"
        strokeWidth="2"
        fill="none"
        opacity="0.7"
        strokeDasharray="5 3"
      />
    </svg>
  );
}
