/**
 * src/components/SvgArtwork.jsx
 * Inline SVG illustrations (no external image dependencies).
 */

import React from 'react';

export function HeroIllustration() {
  return (
    <svg
      viewBox="0 0 420 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-100 h-auto hero-float"
      style={{ maxWidth: '390px' }}
      role="img"
      aria-label="Illustration of campus items including backpack, phone, keys, and magnifying glass"
    >
      {/* Subtle backdrop card */}
      <rect x="28" y="24" width="364" height="248" rx="28" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" />
      <circle cx="88" cy="72" r="22" fill="rgba(56,189,248,0.22)" />
      <circle cx="348" cy="228" r="28" fill="rgba(245,158,11,0.2)" />

      {/* Backpack (top-left) */}
      <g transform="translate(56, 58)">
        <path d="M32 22C32 10 42 2 54 2C66 2 76 10 76 22" stroke="#EAF3FC" strokeWidth="6" strokeLinecap="round" />
        <rect x="14" y="20" width="80" height="92" rx="22" fill="#1D4ED8" stroke="#FFFFFF" strokeWidth="2.5" />
        <path d="M14 52C14 38 26 28 40 28H68C82 28 94 38 94 52V62H14V52Z" fill="#2563EB" />
        <rect x="28" y="72" width="52" height="28" rx="10" fill="#0B2A5B" stroke="#38BDF8" strokeWidth="2" />
        <line x1="44" y1="84" x2="64" y2="84" stroke="#F59E0B" strokeWidth="4" strokeLinecap="round" />
      </g>

      {/* Smartphone (top-right) */}
      <g transform="translate(262, 46)">
        <rect x="0" y="0" width="76" height="128" rx="16" fill="#0B2A5B" stroke="#FFFFFF" strokeWidth="2.5" />
        <rect x="8" y="14" width="60" height="92" rx="9" fill="#EAF3FC" />
        <rect x="24" y="6" width="28" height="4" rx="2" fill="#38BDF8" />
        <circle cx="38" cy="116" r="5" fill="#38BDF8" />
        {/* Notification bubble on phone */}
        <rect x="16" y="34" width="44" height="22" rx="6" fill="#2563EB" />
        <circle cx="26" cy="45" r="4" fill="#F59E0B" />
        <line x1="34" y1="45" x2="52" y2="45" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
        <line x1="16" y1="70" x2="56" y2="70" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" />
        <line x1="16" y1="82" x2="46" y2="82" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
      </g>

      {/* Keys (bottom-left) */}
      <g transform="translate(72, 186)">
        <circle cx="28" cy="28" r="18" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="2.5" />
        <circle cx="28" cy="28" r="6" fill="#0B2A5B" />
        <rect x="44" y="23" width="56" height="10" rx="5" fill="#FBBF24" />
        <rect x="74" y="33" width="8" height="12" rx="2" fill="#FBBF24" />
        <rect x="88" y="33" width="8" height="16" rx="2" fill="#FBBF24" />
      </g>

      {/* Magnifying Glass (center-front focal element) */}
      <g transform="translate(154, 98)">
        <line x1="94" y1="94" x2="132" y2="132" stroke="#0B2A5B" strokeWidth="16" strokeLinecap="round" />
        <line x1="94" y1="94" x2="132" y2="132" stroke="#F59E0B" strokeWidth="10" strokeLinecap="round" />
        <circle cx="56" cy="56" r="48" fill="rgba(234,243,252,0.92)" stroke="#FFFFFF" strokeWidth="6" />
        <circle cx="56" cy="56" r="36" fill="#EAF3FC" stroke="#38BDF8" strokeWidth="2.5" />
        {/* Checkmark inside lens */}
        <path d="M40 57L51 68L73 44" stroke="#16A34A" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

export function AuthIllustration() {
  return (
    <svg
      viewBox="0 0 320 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-100 h-auto"
      style={{ maxWidth: '280px' }}
      role="img"
      aria-label="CampusFind portal illustration"
    >
      <rect x="20" y="18" width="280" height="184" rx="20" fill="rgba(255,255,255,0.09)" stroke="rgba(255,255,255,0.2)" />
      {/* Campus card */}
      <rect x="48" y="48" width="144" height="118" rx="14" fill="#FFFFFF" />
      <rect x="64" y="66" width="56" height="8" rx="4" fill="#2563EB" />
      <rect x="64" y="84" width="110" height="6" rx="3" fill="#CBD5E1" />
      <rect x="64" y="98" width="88" height="6" rx="3" fill="#CBD5E1" />
      <rect x="64" y="122" width="66" height="22" rx="11" fill="#DCFCE7" />
      <path d="M78 133L84 139L96 127" stroke="#15803D" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />

      {/* Shield / Reunion Badge */}
      <g transform="translate(174, 62)">
        <path d="M46 6L84 22V54C84 80 68 100 46 110C24 100 8 80 8 54V22L46 6Z" fill="#0B2A5B" stroke="#38BDF8" strokeWidth="3" />
        <circle cx="46" cy="54" r="20" fill="#F59E0B" />
        <path d="M38 54L44 60L56 48" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

export function EmptyStateIllustration() {
  return (
    <svg
      viewBox="0 0 180 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      width="148"
      height="116"
      className="mb-3"
      aria-hidden="true"
    >
      <circle cx="90" cy="70" r="56" fill="#EAF3FC" />
      <rect x="44" y="48" width="92" height="60" rx="12" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2" />
      <path d="M44 60C44 53.3726 49.3726 48 56 48H78L86 58H124C130.627 58 136 63.3726 136 70V96C136 102.627 130.627 108 124 108H56C49.3726 108 44 102.627 44 96V60Z" fill="#DBEAFE" stroke="#2563EB" strokeWidth="2" />
      <circle cx="118" cy="46" r="18" fill="#FFFFFF" stroke="#0B2A5B" strokeWidth="2.5" />
      <line x1="131" y1="59" x2="144" y2="72" stroke="#F59E0B" strokeWidth="5" strokeLinecap="round" />
      <line x1="112" y1="46" x2="124" y2="46" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
