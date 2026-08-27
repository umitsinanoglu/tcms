# UI Design System v2 — AI Agent Rules & Architecture Guide
## Crimson Coral & Deep Slate — Enterprise SDLC Edition

This document defines the strict, non-negotiable UI/UX implementation rules for AI Agents building interfaces in enterprise SDLC, QA, and test management domains.

---

## 💎 1. Core Principles & The 75-15-10 Visual Rule

1. **Enterprise First**: Clarity over decoration, consistency over novelty.
2. **75-15-10 Color Balance**:
   - **75% Neutral Surfaces**: Canvas `#191e28`, Card/Panel `#222938`, Hover/Secondary `#2b3447`.
   - **15% Supporting Elements**: Border `#333f54`, Muted Text `#94a3b8`.
   - **10% Crimson Coral Accent**: Brand `#ff4b6e`, CTA Gradient `linear-gradient(135deg, #ff4b6e 0%, #d82b4b 100%)`.
3. **Glassmorphism Rule**: Do NOT make every card glassmorphic. Glass (`backdrop-blur-md` + `rgba(34, 41, 56, 0.85)`) is reserved ONLY for Modals, Drawers, Floating Menus, and Popovers.
4. **No Skeuomorphism / Heavy Neumorphism**: Flat enterprise surfaces with clear 1px borders and subtle elevation.

---

## 🎨 2. Design Tokens & Semantic Status Mapping

### Core Tokens:
- Canvas Background: `#191e28` (Dark) / `#f0f3f8` (Light)
- Card/Surface: `#222938` (Dark) / `#ffffff` (Light)
- Surface Secondary: `#2b3447` (Dark) / `#e8ecf3` (Light)
- Structural Border: `#333f54` (Dark) / `#d5ddea` (Light)
- Primary Text: `#f8fafc` (Dark) / `#0f172a` (Light)
- Muted Text: `#94a3b8` (Dark) / `#64748b` (Light)
- Accent Primary: `#ff4b6e`
- Accent Dark: `#d82b4b`
- Accent Glow: `rgba(255, 75, 110, 0.45)`

### Semantic Status Tokens (WCAG 2.2 AA Compliant):
- **PASSED**: `bg-emerald-500/15 text-emerald-400 border-emerald-500/30`
- **FAILED**: `bg-rose-500/15 text-rose-400 border-rose-500/30`
- **BLOCKED**: `bg-amber-500/15 text-amber-400 border-amber-500/30`
- **IN_PROGRESS**: `bg-sky-500/15 text-sky-400 border-sky-500/30`
- **DRAFT / MUTED**: `bg-slate-500/15 text-slate-400 border-slate-500/30`

> ⚠️ **Status Rule**: Never use color alone. Always combine **Icon + Text Label + Background Tint**.

---

## 🧱 3. Typography & Spacing Scale

- **Primary Font**: `Inter` (sans-serif) for headings, body text, form labels, actions.
- **Technical & Metric Font**: `JetBrains Mono` for Test IDs (`TC-1049`), build tags, execution duration, API endpoints, and numeric metrics.
- **Radius System**:
  - `rounded-lg` (8px) for controls, tags, checkboxes.
  - `rounded-[10px]` for buttons and inputs.
  - `rounded-[14px]` for cards, panels, and modals.
  - `rounded-full` (9999px) for status pills.
- **Spacing Scale (4px grid)**: `4px`, `8px`, `12px`, `16px`, `20px`, `24px`, `32px`.

---

## 🚫 4. AI Agent Anti-Patterns (Strictly Prohibited)

1. ❌ **NEVER** paint bright red/neon borders around every card.
2. ❌ **NEVER** use more than ONE Primary CTA button (Crimson Gradient) per section.
3. ❌ **NEVER** omit hover (`-translate-y-0.5`), active (`scale-[0.98]`), loading, and empty states.
4. ❌ **NEVER** use raw unstyled tables or let tables break horizontally on mobile without responsive cards.
5. ❌ **NEVER** create arbitrary spacing like `p-[17px]` or `gap-[13px]`. Follow the 4px scale.

---

## 🚀 5. Component Snippets

### Primary CTA Button:
```tsx
<button className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white transition-all duration-200 rounded-[10px] bg-gradient-to-r from-[#ff4b6e] to-[#d82b4b] hover:from-[#ff6b87] hover:to-[#e6385b] shadow-sm hover:shadow-[0_4px_14px_rgba(255,75,110,0.45)] hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none">
  <Plus className="w-4 h-4" />
  <span>New Test Case</span>
</button>
```

### Secondary Button:
```tsx
<button className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-[#f8fafc] transition-all duration-200 rounded-[10px] bg-[#222938] hover:bg-[#2b3447] border border-[#333f54] hover:border-[#ff4b6e]/30 active:scale-[0.98]">
  <RefreshCw className="w-4 h-4 text-[#94a3b8]" />
  <span>Refresh</span>
</button>
```

### Form Input:
```tsx
<div className="space-y-1.5">
  <label className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">Test Suite Title</label>
  <input
    type="text"
    className="w-full px-3.5 py-2.5 rounded-[10px] bg-[#191e28] border border-[#333f54] text-[#f8fafc] text-sm placeholder-slate-500 focus:outline-none focus:border-[#ff4b6e] focus:ring-2 focus:ring-[#ff4b6e]/20 transition-all duration-200"
    placeholder="e.g. Authentication & Authorization Suite"
  />
</div>
```
