---
name: ui-design-system
description: Enterprise SDLC UI Design System v2 (Crimson Coral & Deep Slate). Design tokens, WCAG 2.2 AA accessibility, blueprints, and production guidelines.
---

# UI Design System v2 — Enterprise SDLC Edition (AI Agent Skill)

This skill provides an enterprise-ready, data-dense UI/UX Design System tailored for SDLC, QA, test management, and fintech applications.

---

## 🎨 1. Theme Identity & Palette

### Muted Corporate Crimson & Deep Slate
| Property | Dark Theme | Light Theme | Usage |
| :--- | :--- | :--- | :--- |
| **Canvas Background** | `#141821` | `#f2f5f8` | Root application background |
| **Card & Panel Surface** | `#1d232f` | `#ffffff` | Primary cards, grids, sidebars |
| **Secondary Surface** | `#262e3d` | `#e6ebf2` | Hover rows, secondary containers |
| **Structural Border** | `#2e3748` | `#d0d8e4` | 1px high-contrast dividers |
| **Text Primary** | `#f1f5f9` | `#0f172a` | Headers, main content |
| **Text Muted** | `#8e9bb0` | `#64748b` | Subtitles, labels, timestamps |
| **Brand Accent** | `#b83a4b` | `#b83a4b` | Muted Corporate Crimson primary action |
| **Accent Dark** | `#821c2b` | `#821c2b` | Gradient end, pressed state |
| **Accent Glow** | `rgba(184, 58, 75, 0.22)` | `rgba(184, 58, 75, 0.15)` | Focus ring & CTA hover glow |

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
<button className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white transition-all duration-200 rounded-[10px] bg-gradient-to-r from-[#b83a4b] to-[#821c2b] hover:from-[#c54859] hover:to-[#962534] shadow-sm hover:shadow-[0_4px_12px_rgba(130,28,43,0.35)] hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none">
  <Plus className="w-4 h-4" />
  <span>New Test Case</span>
</button>
```

### Metric Card:
```tsx
<div className="p-5 rounded-[14px] bg-[#1d232f] border border-[#2e3748] hover:border-[#b83a4b]/30 transition-all duration-200 shadow-enterprise-xs group">
  <div className="flex items-center justify-between">
    <span className="text-xs font-semibold text-[#8e9bb0] uppercase tracking-wider">Pass Rate</span>
    <div className="p-2 rounded-lg bg-[#b83a4b]/10 text-[#b83a4b] group-hover:scale-105 transition-transform">
      <Activity className="w-4 h-4" />
    </div>
  </div>
  <div className="mt-3 flex items-baseline gap-2">
    <span className="text-2xl font-bold font-mono text-[#f1f5f9] tracking-tight">98.4%</span>
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
