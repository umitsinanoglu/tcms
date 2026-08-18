---
name: ui-design-system
description: Enterprise SDLC UI Design System v2 (Crimson Coral & Deep Slate). Design tokens, WCAG 2.2 AA accessibility, blueprints, and production guidelines.
---

# UI Design System v2 — Enterprise SDLC Edition (AI Agent Skill)

This skill provides an enterprise-ready, data-dense UI/UX Design System tailored for SDLC, QA, test management, and fintech applications.

---

## 🎨 1. Theme Identity & Palette

### Crimson Coral & Deep Slate
| Property | Dark Theme | Light Theme | Usage |
| :--- | :--- | :--- | :--- |
| **Canvas Background** | `#191e28` | `#f0f3f8` | Root application background |
| **Card & Panel Surface** | `#222938` | `#ffffff` | Primary cards, grids, sidebars |
| **Secondary Surface** | `#2b3447` | `#e8ecf3` | Hover rows, secondary containers |
| **Structural Border** | `#333f54` | `#d5ddea` | 1px high-contrast dividers |
| **Text Primary** | `#f8fafc` | `#0f172a` | Headers, main content |
| **Text Muted** | `#94a3b8` | `#64748b` | Subtitles, labels, timestamps |
| **Brand Accent** | `#ff4b6e` | `#ff4b6e` | Crimson Coral primary action |
| **Accent Dark** | `#d82b4b` | `#d82b4b` | Gradient end, pressed state |
| **Accent Glow** | `rgba(255, 75, 110, 0.45)` | `rgba(255, 75, 110, 0.25)` | Focus ring & CTA hover glow |

---

## 📐 2. The 75-15-10 Visual Rule
- **75% Neutral**: Deep Slate surfaces and backgrounds.
- **15% Supporting**: Border lines, muted labels, subtle separators.
- **10% Accent**: Primary buttons, active navigation items, selected status.

> 🚫 **Glassmorphism Restriction**: Use `backdrop-blur-md` exclusively on Modals, Drawers, Dropdowns, and Popovers. Do not apply blur or glass effects to regular cards or table cells.

---

## 🚦 3. Semantic Status System (WCAG 2.2 AA)

Never rely on color alone. Always combine **Icon + Label + Background Tint**:

```tsx
// PASSED
<span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
  <CheckCircle2 className="w-3.5 h-3.5" />
  PASSED
</span>

// FAILED
<span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-rose-500/15 text-rose-400 border border-rose-500/30">
  <XCircle className="w-3.5 h-3.5" />
  FAILED
</span>

// BLOCKED
<span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30">
  <AlertTriangle className="w-3.5 h-3.5" />
  BLOCKED
</span>

// IN_PROGRESS
<span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-sky-500/15 text-sky-400 border border-sky-500/30">
  <PlayCircle className="w-3.5 h-3.5" />
  IN_PROGRESS
</span>
```

---

## 🧱 4. Component Blueprints

### Primary Action Button:
```tsx
<button className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white transition-all duration-200 rounded-[10px] bg-gradient-to-r from-[#ff4b6e] to-[#d82b4b] hover:from-[#ff6b87] hover:to-[#e6385b] shadow-sm hover:shadow-[0_4px_14px_rgba(255,75,110,0.45)] hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none">
  <Plus className="w-4 h-4" />
  <span>New Test Case</span>
</button>
```

### Metric Card:
```tsx
<div className="p-5 rounded-[14px] bg-[#222938] border border-[#333f54] hover:border-[#ff4b6e]/30 transition-all duration-200 shadow-enterprise-xs group">
  <div className="flex items-center justify-between">
    <span className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">Pass Rate</span>
    <div className="p-2 rounded-lg bg-[#ff4b6e]/10 text-[#ff4b6e] group-hover:scale-105 transition-transform">
      <Activity className="w-4 h-4" />
    </div>
  </div>
  <div className="mt-3 flex items-baseline gap-2">
    <span className="text-2xl font-bold font-mono text-[#f8fafc] tracking-tight">98.4%</span>
    <span className="text-xs font-medium text-emerald-400">↑ +1.2%</span>
  </div>
</div>
```

---

## 🔄 Export to Other Workspaces
Run:
```bash
./scripts/export_ui_design_system.sh /path/to/target-project
```
