import React, { useId } from "react";

/**
 * TriageLogo — The modern geometric brand mark for Triage.
 * Represents multi-tier intake, rapid prioritization, and calm clarity.
 *
 * @param {Object} props
 * @param {number} [props.size=32] - Width and height of the icon mark in pixels
 * @param {boolean} [props.showWordmark=false] - Whether to show the "Triage" text beside the mark
 * @param {boolean} [props.betaTag=false] - Whether to show the "BETA" pill tag
 * @param {string} [props.variant="coral"] - "coral" | "glass" | "minimal"
 * @param {string} [props.className=""] - Custom classes for the outer wrapper
 * @param {string} [props.textClassName=""] - Custom classes for the wordmark text
 * @param {boolean} [props.inverted=false] - For white text on colored backgrounds
 */
export default function TriageLogo({
  size = 32,
  showWordmark = false,
  betaTag = false,
  variant = "coral",
  className = "",
  textClassName = "",
  inverted = false,
}) {
  const uid = useId().replace(/:/g, "");

  const bgGradId = `triage-bg-${uid}`;
  const leftWingId = `left-wing-${uid}`;
  const rightWingId = `right-wing-${uid}`;
  const pillarId = `pillar-${uid}`;
  const glowId = `glow-${uid}`;
  const shadowId = `shadow-${uid}`;

  const renderMarkSvg = () => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
    >
      <defs>
        {/* Coral Accent Gradient */}
        <linearGradient id={bgGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF7A45" />
          <stop offset="48%" stopColor="#EA580C" />
          <stop offset="100%" stopColor="#C2390A" />
        </linearGradient>

        {/* Facet 1: Left Wing Gradient */}
        <linearGradient id={leftWingId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#FFE8DE" stopOpacity="0.8" />
        </linearGradient>

        {/* Facet 2: Right Wing Gradient */}
        <linearGradient id={rightWingId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
          <stop offset="100%" stopColor="#FFDCB8" stopOpacity="0.85" />
        </linearGradient>

        {/* Facet 3: Center Pillar with Priority Anchor */}
        <linearGradient id={pillarId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="65%" stopColor="#FFF2EA" />
          <stop offset="100%" stopColor="#FFE0CE" />
        </linearGradient>

        {/* Ambient Glow */}
        <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#EA580C" floodOpacity="0.35" />
        </filter>

        {/* Inner Facet Depth */}
        <filter id={shadowId} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1" floodColor="#7A1D03" floodOpacity="0.3" />
        </filter>
      </defs>

      {/* Outer Squircle Container based on Variant */}
      {variant === "coral" && (
        <>
          <rect
            x="3"
            y="3"
            width="58"
            height="58"
            rx="16"
            fill={`url(#${bgGradId})`}
            filter={`url(#${glowId})`}
          />
          <rect
            x="3.5"
            y="3.5"
            width="57"
            height="57"
            rx="15.5"
            stroke="#FFFFFF"
            strokeWidth="1.2"
            strokeOpacity="0.4"
          />
        </>
      )}

      {variant === "glass" && (
        <>
          <rect
            x="3"
            y="3"
            width="58"
            height="58"
            rx="16"
            fill="rgba(255, 255, 255, 0.18)"
            className="backdrop-blur-md"
          />
          <rect
            x="3.5"
            y="3.5"
            width="57"
            height="57"
            rx="15.5"
            stroke="#FFFFFF"
            strokeWidth="1.2"
            strokeOpacity="0.35"
          />
        </>
      )}

      {/* The 3-Facet Triage Emblem */}
      <g filter={variant === "coral" ? `url(#${shadowId})` : undefined}>
        {/* Facet 1: Left Priority Wing */}
        <path
          d="M 15 17 C 15 15.6 16 15 17.5 15 H 29.5 C 30.5 15 31 15.7 31 16.7 V 24.3 C 31 25.3 30.5 26 29.5 26 H 17.5 C 16 26 15 25.1 15 23.8 Z"
          fill={variant === "minimal" ? "currentColor" : `url(#${leftWingId})`}
        />

        {/* Facet 2: Right Priority Wing */}
        <path
          d="M 33 16.7 C 33 15.7 33.5 15 34.5 15 H 46.5 C 48 15 49 15.6 49 17 V 23.8 C 49 25.1 48 26 46.5 26 H 34.5 C 33.5 26 33 25.3 33 24.3 Z"
          fill={variant === "minimal" ? "currentColor" : `url(#${rightWingId})`}
        />

        {/* Facet 3: Center Pillar with Priority Arrow Tip */}
        <path
          d="M 27 28.5 C 27 27.7 27.7 27 28.5 27 H 35.5 C 36.3 27 37 27.7 37 28.5 V 41.5 L 32 47.5 L 27 41.5 Z"
          fill={variant === "minimal" ? "currentColor" : `url(#${pillarId})`}
        />
      </g>

      {/* Focus Beacon Pip (Top Right) */}
      {variant !== "minimal" && (
        <circle cx="47.5" cy="16.5" r="1.5" fill="#FFFFFF" opacity="0.9" />
      )}
    </svg>
  );

  if (!showWordmark) {
    return <div className={`inline-flex items-center justify-center ${className}`}>{renderMarkSvg()}</div>;
  }

  const defaultTextColor = inverted
    ? "text-white"
    : "text-text-primary dark:text-white";

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {renderMarkSvg()}
      <div className="flex items-center gap-2">
        <span
          className={`font-extrabold tracking-tight leading-none ${
            size >= 36 ? "text-xl lg:text-2xl" : "text-base lg:text-lg"
          } ${textClassName || defaultTextColor}`}
        >
          Triage
        </span>
        {betaTag && (
          <span className="text-[9px] font-extrabold text-accent dark:text-[#FFA278] bg-accent/15 dark:bg-accent/25 px-1.5 py-0.5 rounded-md uppercase tracking-wider">
            Beta
          </span>
        )}
      </div>
    </div>
  );
}
