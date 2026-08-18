# UI Design System v2 — AI-Native
## Crimson Coral & Deep Slate — Enterprise SDLC Edition

> **Hedef**: Bu doküman; kurumsal, bankacılık ve finansal teknoloji ortamlarında kullanılan SDLC, QA, Test Case Management (TCMS), Requirement Management, Release Management ve Incident Management platformları için **yüksek bilgi yoğunluklu (data-dense)**, **erişilebilir (WCAG 2.2 AA)**, **estetik ve modern** arayüzler inşa etmek üzere hazırlanmış ana tasarım spesifikasyonudur. Hem frontend geliştiriciler hem de AI Coding Agent'lar tarafından doğrudan uygulanabilir.

---

## 📑 İçindekiler (Table of Contents)

1. [Amaç ve Kapsam](#0-amaç-ve-kapsam)
2. [Tasarım Felsefesi (Design Philosophy)](#1-design-philosophy)
3. [Görsel Kimlik ve Renk Paleti (Visual Identity & Tokens)](#2-visual-identity--tokens)
4. [Görsel Stil Kuralları (Visual Style Rules)](#3-visual-style-rules)
5. [Görsel Hiyerarşi (Visual Hierarchy)](#4-visual-hierarchy)
6. [Vurgu Rengi Kullanım Kuralı (Accent 75-15-10 Rule)](#5-accent-usage--75-15-10-rule)
7. [Tipografi Sistemi (Typography System)](#6-typography-system)
8. [Boşluk Sistemi (Spacing System)](#7-spacing-system)
9. [Köşe Yuvarlaklığı (Border Radius System)](#8-border-radius-system)
10. [Derinlik ve Gölgeler (Elevation & Shadows)](#9-elevation--shadows)
11. [Uygulama Yerleşim Mimarisi (Layout System)](#10-layout-system)
12. [Sayfa Yerleşim Desenleri (Page Layout Patterns)](#11-page-layout-patterns)
    - [11.1 Dashboard Pattern](#111-dashboard-pattern)
    - [11.2 CRUD / Management Pattern](#112-crud--management-pattern)
    - [11.3 Detail Pattern](#113-detail-pattern)
    - [11.4 Master-Detail Pattern](#114-master-detail-pattern)
    - [11.5 Wizard Pattern](#115-wizard-pattern)
    - [11.6 Settings Pattern](#116-settings-pattern)
13. [SDLC'ye Özgü Tasarım Desenleri (SDLC-Specific Patterns)](#12-sdlc-specific-patterns)
14. [Veri Yoğunluğu Kuralları (Data Density)](#13-data-density)
15. [Veri Tablosu Kuralları (Data Table Rules)](#14-data-table-rules)
16. [Bileşen Durum Sistemi (Component State System)](#15-component-state-system)
17. [Yükleme Durumları (Loading States)](#16-loading-states)
18. [Boş Durumlar (Empty States)](#17-empty-states)
19. [Hata Durumları ve Kurtarma (Error States)](#18-error-states)
20. [Duyarlı Tasarım ve Kırılma Noktaları (Responsive Design)](#19-responsive-design)
21. [Erişilebilirlik (Accessibility - WCAG 2.2 AA)](#20-accessibility--wcag-22-aa)
22. [Etkileşim ve Mikro Animasyonlar (Interaction & Motion)](#21-interaction--motion)
23. [Navigasyon Mimarisi (Navigation Architecture)](#22-navigation-architecture)
24. [AI Tasarım Karar Ağacı (AI Design Decision Tree)](#23-ai-design-decision-tree)
25. [AI Bileşen Seçim Kuralları (AI Component Selection Rules)](#24-ai-component-selection-rules)
26. [AI Anti-Pattern Kuralları (AI Anti-Pattern Rules)](#25-ai-anti-pattern-rules)
27. [Birincil Eylem Kuralı (Primary Action Rule)](#26-primary-action-rule)
28. [Form Tasarım Kuralları (Form Design Rules)](#27-form-design-rules)
29. [Durum Sistemi ve Renk Anlamları (Status System)](#28-status-system)
30. [Teknik Veri Gösterim Standartları (Technical Data)](#29-technical-data)
31. [Doğrudan Uygulanabilir Bileşen Şablonları (Ready-to-Use Component Blueprints)](#30-ready-to-use-component-blueprints)
32. [AI Ekran Üretim Protokolü (AI Screen Generation Protocol)](#31-ai-screen-generation-protocol)
33. [AI Uygulama Prompt Şablonu (AI Implementation Prompt)](#32-ai-implementation-prompt)
34. [Kendi Kendini Doğrulama Listesi (Self-Validation Checklist)](#33-self-validation-checklist)
35. [QA Odaklı UI Doğrulama (QA-Oriented UI Validation)](#34-qa-oriented-ui-validation)
36. [Nihai Tasarım İlkesi (Final Design Principle)](#35-final-design-principle)

---

## 0. Amaç ve Kapsam

Bu Design System; kurumsal, bankacılık ve finansal teknoloji ortamlarında kullanılan SDLC, QA, Test Management, Requirement Management, Release Management, Incident Management ve benzeri web uygulamalarının modern, güvenilir, erişilebilir, tutarlı ve veri odaklı kullanıcı arayüzleri üretmesini sağlamak amacıyla oluşturulmuştur.

Bu doküman:
* **Frontend Geliştiriciler**,
* **UI/UX Tasarımcılar**,
* **QA & Test Ekipleri**,
* hem de **AI Coding Agent'lar** (Gemini, Claude, GPT, Antigravity)

tarafından doğrudan uygulanabilir.

> [!IMPORTANT]
> **Temel Hedef**: Modern ve estetik görünürken bilgi yoğunluğunu, kullanılabilirliği, erişilebilirliği ve operasyonel verimliliği koruyan Enterprise UI üretmek.

---

## 1. Design Philosophy

### 1.1 Primary Design Philosophy
Bu sistem **Modern Enterprise + Data-First + Layered UI** yaklaşımını kullanır.

UI'ın amacı yüzeysel bir görsel gösteriş değil:
1. Bilgiyi hızlı ve hatasız sunmak,
2. Kullanıcının doğru kararı vermesini sağlamak,
3. İş akışlarını (workflows) açık ve öngörülebilir kılmak,
4. Operasyonel hataları azaltmak,
5. Kullanıcıyı adım adım yönlendirmek,
6. Kritik bilgileri güçlü görsel hiyerarşi ile öne çıkarmaktır.

### 1.2 Core Principles
> 🔹 **Clarity over decoration** (Süsleme yerine netlik)  
> 🔹 **Consistency over novelty** (Gereksiz yenilik arayışı yerine tutarlılık)  
> 🔹 **Information hierarchy over visual effects** (Görsel efektler yerine bilgi hiyerarşisi)  
> 🔹 **User workflow over visual experimentation** (Görsel deneyler yerine iş akışı akıcılığı)

---

## 2. Visual Identity & Tokens

### 2.1 Renk Paleti (Color Tokens)

Tema adı: **Crimson Coral & Deep Slate**

| Token Adı | Koyu Mod (Dark) | Açık Mod (Light) | Kullanım Alanı | Tailwind Sınıfı |
| :--- | :--- | :--- | :--- | :--- |
| `background` | `#191e28` | `#f0f3f8` | Uygulama ana zemin rengi | `bg-[#191e28]` |
| `surface` | `#222938` | `#ffffff` | Kartlar, modallar, yan menüler | `bg-[#222938]` |
| `surface-secondary` | `#2b3447` | `#e8ecf3` | Hover satırları, ikincil kutular, toolbar | `bg-[#2b3447]` |
| `border` | `#333f54` | `#d5ddea` | Sınır çizgileri ve ayraçlar | `border-[#333f54]` |
| `text-primary` | `#f8fafc` | `#0f172a` | Başlıklar, birincil metinler | `text-[#f8fafc]` |
| `text-muted` | `#94a3b8` | `#64748b` | İkincil metinler, tarihler, etiketler | `text-[#94a3b8]` |
| `accent-primary` | `#ff4b6e` | `#ff4b6e` | Crimson Coral ana marka & vurgu rengi | `bg-[#ff4b6e]` / `text-[#ff4b6e]` |
| `accent-dark` | `#d82b4b` | `#d82b4b` | Buton gradient sonu, aktif durum | `#d82b4b` |
| `accent-hover` | `#ff6b87` | `#e6385b` | Vurgu elemanları hover hali | `hover:bg-[#ff6b87]` |
| `accent-glow` | `rgba(255, 75, 110, 0.45)` | `rgba(255, 75, 110, 0.25)` | Neon gölge ve odak ışıması | `shadow-[0_0_20px_rgba(255,75,110,0.45)]` |
| `glass-panel-bg` | `rgba(34, 41, 56, 0.85)` | `rgba(255, 255, 255, 0.90)` | Cam arka planı (backdrop-blur ile) | `bg-[#222938]/85 backdrop-blur-md` |
| `glass-panel-border`| `rgba(255, 75, 110, 0.18)` | `rgba(255, 75, 110, 0.20)` | Cam panel kenarlık vurgusu | `border-[#ff4b6e]/20` |

### 2.2 Semantik Durum Renkleri (Semantic Status Colors)

| Durum | Koyu Zemin | Açık Zemin | Yazı / İkon | Border | Anlam / Kullanım |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **PASSED / SUCCESS** | `rgba(16, 185, 129, 0.15)` | `#d1fae5` | `#34d399` | `#059669` | Başarılı test, onaylı kayıt |
| **FAILED / ERROR** | `rgba(239, 68, 68, 0.15)` | `#fee2e2` | `#f87171` | `#dc2626` | Başarısız test, kritik hata, defect |
| **BLOCKED / WARNING** | `rgba(245, 158, 11, 0.15)` | `#fef3c7` | `#fbbf24` | `#d97706` | Bloklanmış koşum, dikkat uyarısı |
| **IN_PROGRESS / INFO**| `rgba(59, 130, 246, 0.15)` | `#dbeafe` | `#60a5fa` | `#2563eb` | Devam eden işlem, taslak, bilgi |
| **MUTED / SKIPPED** | `rgba(148, 163, 184, 0.15)`| `#f1f5f9` | `#94a3b8` | `#64748b` | Atlanmış test, pasif, arşivlenmiş |

---

## 3. Visual Style Rules

### 3.1 Preferred Style (Tercih Edilen Tarz)
* **Düz Kurumsal Yüzeyler (Flat Enterprise Surfaces)**: Mat ve gözü yormayan zeminler.
* **Hafif Yükseltme (Subtle Elevation)**: Katman ayrımı için yumuşak gölgeler.
* **Net Sınır Çizgileri (Clear Borders)**: 1px yüksek kontrastlı `#333f54` kenarlıklar.
* **Güçlü Tipografi Hiyerarşisi**: Başlık, gövde ve etiketlerde net boyut/ağırlık ayrımı.
* **Yapılandırılmış Boşluklar (Structured Whitespace)**: 4px tabanlı spacing ölçeği.
* **Kontrollü Köşe Yuvarlaklığı**: Standart 8px, 10px, 14px ve 9999px.
* **Veri Yoğunluklu Düzenler (Data-Dense Layouts)**: Boş alan israfı yapmayan, kompakt ve taranabilir yapılar.
* **Minimum Görsel Gürültü**: Gereksiz illüstrasyon, animasyon ve abartılı efektlerden arındırılmış.

### 3.2 Skeuomorphism Kuralı
> [!CAUTION]
> **Skeuomorphic tasarım kullanma.**  
> UI bileşenlerini fiziksel klasör, defter, kağıt dokusu, kabartmalı plastik buton gibi gerçek dünya nesnelerine benzetmeye çalışma.

### 3.3 Neumorphism Kuralı
> [!WARNING]
> **Neumorphism ana tasarım dili değildir.**  
> Aşırı soft-shadow ve kabartmalı (embossed) UI kullanma. Kontrastı düşüren zemin-buton birleşimlerinden kesinlikle kaçın.

### 3.4 Glassmorphism Kuralı
> [!NOTE]
> Glassmorphism temel arayüz dili değil, yalnızca derinlik katmanı oluşturmak için sınırlı kullanılan bir vurgu tekniğidir.
> 
> **Kullanılabilecek Alanlar:**
> - Modal pencereleri & Backdrop katmanları
> - Yan Çekmeceler (Drawers) & Floating Paneller
> - Açılır Menüler (Dropdowns) & Popover'lar
> - Öne çıkarılmış KPI veya Featured panel arka planları
> 
> **Yasak:** Tüm standart tablo hücrelerini, her kartı ve tüm form alanlarını glass/blur yapma.

---

## 4. Visual Hierarchy

Her sayfa ve ekran aşağıdaki katı görsel hiyerarşiyi takip etmelidir:

```text
1. Page Purpose (Sayfa Amacı & Başlık)
2. Primary Action (Ana Eylem - CTA)
3. Important Information (Kritik Metrikler & Uyarılar)
4. Secondary Information (Tablolar & Listeler)
5. Supporting Actions (Filtreler, Dışa Aktar, Arama)
6. Decorative Elements (Ayrım Çizgileri, İkonlar)
```

> **Kritik Kural**: Dekoratif öğeler asla birincil eylem (Primary CTA), kritik hata uyarısı veya durum rozetleri ile görsel rekabete girmemelidir.

---

## 5. Accent Usage & 75-15-10 Rule

Crimson Coral (`#ff4b6e`) yalnızca dekoratif bir renk değildir; kullanıcıyı aksiyona sevk eden işlevsel bir odaklama aracıdır.

### 5.1 Accent Renginin Kullanım Alanları:
* **Primary CTA** (Yeni Test Oluştur, Koşumu Başlat, Kaydet)
* **Aktif Navigasyon Sekmesi & Menü Seçimi**
* **Seçili Satır / Odak (Focus) Durumu**
* **Önemli KPI / Metrik Değeri**
* **Aktif Adım Göstergesi (Wizard Step)**

### 5.2 75-15-10 Renk Dağılım Oranı
```text
┌─────────────────────────────────────────────────────────────┐
│ 75% Nötr Yüzeyler (#191e28, #222938, #2b3447)              │
├──────────────────────────────┬──────────────────────────────┤
│ 15% İkincil / Destekleyici   │ 10% Crimson Coral Vurgusu    │
│ (#333f54 border, #94a3b8)    │ (#ff4b6e CTA, Active, Focus) │
└──────────────────────────────┴──────────────────────────────┘
```

> [!WARNING]
> Accent rengini sayfadaki tüm kartların çerçevesine (border) basma. Glow efektini tüm butonlara uygulama.

---

## 6. Typography System

* **Ana Tipografi**: `Inter` (Okunabilir, kurumsal sans-serif)
* **Teknik & Veri Tipografisi**: `JetBrains Mono` (ID, kod, log, metrik, endpoint)

### 6.1 Tipografi Ölçeği (Type Scale)

| Düzey | Boyut / Satır Yüksekliği | Ağırlık (Weight) | Tailwind Sınıfları | Kullanım Alanı |
| :--- | :--- | :--- | :--- | :--- |
| **Display** | `48px / 56px` | 700 (Bold) | `text-5xl font-bold tracking-tight` | Karşılama ve Büyük Rapor Başlığı |
| **H1** | `32px / 40px` | 700 (Bold) | `text-3xl font-bold tracking-tight` | Sayfa Ana Başlığı |
| **H2** | `24px / 32px` | 600 (Semibold) | `text-2xl font-semibold` | Bölüm / Panel Başlıkları |
| **H3** | `18px / 28px` | 600 (Semibold) | `text-lg font-semibold` | Kart & Modal Başlıkları |
| **Body** | `14px / 20px` | 400 (Regular) | `text-sm font-normal leading-relaxed`| Tablo metinleri, formlar, açıklamalar |
| **Body Small**| `13px / 18px` | 400 (Regular) | `text-[13px] leading-snug` | İkincil detaylar, listeler |
| **Caption** | `12px / 16px` | 400 (Regular) | `text-xs text-[#94a3b8]` | Tarihler, breadcrumbs, ipuçları |
| **Label** | `12px / 16px` | 600 (Semibold) | `text-xs font-semibold uppercase tracking-wider` | Form etiketleri, tablo başlıkları (TH) |
| **Mono Data** | `13px / 18px` | 500 (Medium) | `font-mono text-[13px]` | ID (`TC-00482`), API route, versiyon |

---

## 7. Spacing System

Tüm boşluklar **4px ızgara tabanı** üzerinde tutarlı olarak inşa edilir:

```text
4px  (1)  → İkon - metin arası, iç rozet boşlukları
8px  (2)  → Form etiket - girdi arası, kompakt buton padding (py-2 px-3)
12px (3)  → Komponent içi eleman aralıkları, toolbar eleman boşlukları
16px (4)  → Standart kart içi eleman ayrımı, form satır boşlukları
20px (5)  → Kart iç dolgusu (Card padding - p-5)
24px (6)  → Bölümler arası boşluk (Section gap), panel padding (p-6)
32px (8)  → Sayfa genel padding (p-8)
48px (12) → Büyük modül ayrımı
64px (16) → Sayfa alt boşluğu / Geniş zemin mesafesi
```

---

## 8. Border Radius System

| Eleman Tipi | Radius Değeri | Tailwind Sınıfı |
| :--- | :--- | :--- |
| **Küçük Kontroller / Tag / Checkbox** | `8px` | `rounded-lg` |
| **Butonlar & Input Form Elemanları** | `10px` | `rounded-[10px]` |
| **Kartlar, Paneller & Modallar** | `14px` | `rounded-[14px]` |
| **Büyük Konteynerlar & Sayfa Panoları** | `16px` | `rounded-2xl` |
| **Pills & Durum Rozetleri** | `9999px` | `rounded-full` |

---

## 9. Elevation & Shadows

```css
.shadow-enterprise-xs { box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.25); }
.shadow-enterprise-sm { box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.30); }
.shadow-enterprise-md { box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.40); }
.shadow-enterprise-lg { box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.50); }
.shadow-enterprise-xl { box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.65); }
.shadow-accent-glow   { box-shadow: 0 0 20px rgba(255, 75, 110, 0.45); }
```

---

## 10. Layout System

### 10.1 Standart Enterprise Sayfa Mimarisi

```text
┌────────────────────────────────────────────────────────────────────────┐
│ Header (h-14 / 56px) - Logo, Global Search, Project Select, User Info  │
├────────────────────┬───────────────────────────────────────────────────┤
│ Sidebar            │ Main Content Area (padding: 24px - 32px)          │
│ (240px persistent  │                                                   │
│  72px collapsed)   │ ┌───────────────────────────────────────────────┐ │
│                    │ │ Page Header (Title + Breadcrumb + Primary CTA)│ │
│ - Dashboard        │ └───────────────────────────────────────────────┘ │
│ - Requirements     │ ┌───────────────────────────────────────────────┐ │
│ - Test Suites      │ │ Analytics / KPI Cards Row                     │ │
│ - Test Runs        │ └───────────────────────────────────────────────┘ │
│ - Defects          │ ┌───────────────────────────────────────────────┐ │
│ - Reports          │ │ Data Grid / Workspace Panel                   │ │
│ - Settings         │ └───────────────────────────────────────────────┘ │
└────────────────────┴───────────────────────────────────────────────────┘
```

---

## 11. Page Layout Patterns

AI Agent yeni bir ekran kodlamadan önce sayfanın hangi desene ait olduğunu seçmelidir:

- **11.1 Dashboard Pattern**: KPI ızgarası + Grafikler + Aktivite Akışı
- **11.2 CRUD / Management Pattern**: Arama & Filtre Araç Çubuğu + Veri Tablosu + Sayfalama
- **11.3 Detail Pattern**: Durum Başlığı + Özet Paneli + Detay Sekmeleri (Tabs)
- **11.4 Master-Detail Pattern**: Sol Ağaç Gezgini (`30%`) + Sağ Form / Koşum Detayı (`70%`)
- **11.5 Wizard Pattern**: Adım Göstergesi (Stepper) + Adım Formu + İleri/Geri Kontrolleri
- **11.6 Settings Pattern**: Dikey Kategori Menüsü + Gruplu Form Kutuları + Alt Kaydetme Barı

---

## 12. SDLC-Specific Patterns

Traceability (İzlenebilirlik) gereksinimi:
`Requirement` → `Acceptance Criteria` → `Test Case` → `Execution` → `Defect` → `Release`.
Tüm ekranlarda bu varlıklar arasında tıklanabilir rozet köprüleri (Badge Links) sağlanır.

---

## 13. Data Density

* Tablolar varsayılan olarak **Kompakt** (`py-2.5 px-4`) olarak inşa edilir.
* Bilgi yoğunluğu taranabilirliği engellememelidir.

---

## 14. Data Table Rules

1. **Sticky Header**: Tablo dikey kaydırıldığında başlıklar (`TH`) sabit kalır (`sticky top-0 bg-[#222938] z-10`).
2. **Column Sorting**: Tıklanabilir sütun başlığı + ok ikonu (`↑↓`).
3. **Multi-Select & Bulk Actions**: Checkbox ile çoklu seçim yapıldığında üstte beliren toplu işlem çubuğu.
4. **Row Quick Actions**: Satırın en sağında hover anında beliren hızlı butonlar (Edit, Run, Duplicate, Delete).
5. **Monospace ID Sütunu**: Test ve Hata ID'leri sabit genişlikli ve monospace olmalıdır.

---

## 15. Component State System

Her etkileşimli bileşen şu 10 durumu eksiksiz desteklemelidir:
`Default`, `Hover`, `Focus`, `Active`, `Disabled`, `Loading`, `Success`, `Error`, `Readonly`, `Empty`.

---

## 16. Accessibility (WCAG 2.2 AA)

* **Yalnızca Renk Yasağı**: Bir durum asla sadece kırmızı/yeşil renk ile belirtilmez. Mutlaka **İkon + Metin + Renk** üçlüsü birlikte kullanılır (Örn: `✓ PASSED`, `✕ FAILED`).
* **Klavye Erişilebilirliği**: `Tab` ile tüm buton, girdi ve menülere erişilebilir olmalı; `focus-visible:ring-2 focus-visible:ring-[#ff4b6e]` standardı korunmalıdır.
* **Kontrast**: Metin ile arka plan arasında minimum **4.5:1** kontrast oranı garanti edilir.

---

## 17. Doğrudan Uygulanabilir Bileşen Şablonları (Ready-to-Use Blueprints)

### A. Primary Action Button (Crimson Gradient + Glow)
```tsx
<button className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white transition-all duration-200 rounded-[10px] bg-gradient-to-r from-[#ff4b6e] to-[#d82b4b] hover:from-[#ff6b87] hover:to-[#e6385b] shadow-sm hover:shadow-[0_4px_14px_rgba(255,75,110,0.45)] hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none">
  <Plus className="w-4 h-4" />
  <span>Yeni Test Senaryosu</span>
</button>
```

### B. Secondary Button
```tsx
<button className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-[#f8fafc] transition-all duration-200 rounded-[10px] bg-[#222938] hover:bg-[#2b3447] border border-[#333f54] hover:border-[#ff4b6e]/30 active:scale-[0.98]">
  <RefreshCw className="w-4 h-4 text-[#94a3b8]" />
  <span>Yenile</span>
</button>
```

### C. Glass Modal Container
```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
  <div className="w-full max-w-xl rounded-[14px] bg-[#222938]/95 border border-[#333f54] shadow-enterprise-xl p-6 relative overflow-hidden backdrop-blur-xl">
    <div className="flex items-center justify-between pb-4 border-b border-[#333f54]">
      <h3 className="text-lg font-semibold text-[#f8fafc] tracking-tight flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-[#ff4b6e]" />
        Yeni Test Koşumu
      </h3>
      <button className="text-[#94a3b8] hover:text-white p-1 rounded-lg hover:bg-[#2b3447] transition-colors">
        <X className="w-5 h-5" />
      </button>
    </div>
    <div className="py-4 space-y-4">
      {/* Form Content */}
    </div>
    <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#333f54]">
      <button className="px-4 py-2 rounded-[10px] text-sm text-[#94a3b8] hover:text-white hover:bg-[#2b3447] transition-colors">
        İptal
      </button>
      <button className="btn-crimson px-5 py-2 rounded-[10px] text-sm font-medium">
        Koşumu Başlat
      </button>
    </div>
  </div>
</div>
```

### D. Durum Rozetleri (Status Badges)
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
```

---

## 18. AI Uygulama Prompt Şablonu

```markdown
Lütfen bu ekranı "Crimson Coral & Deep Slate — Enterprise SDLC Edition v2" standartlarına tam sadık kalarak inşa et:
- Zemin: #191e28, Kartlar & Paneller: #222938, İkincil/Hover Yüzeyler: #2b3447, Kenarlıklar: #333f54 (1px)
- Vurgu rengi: #ff4b6e (Yalnızca birincil CTA, seçili menü ve odak durumlarında kullan)
- Tipografi: Inter (font-sans), ID/Kod/Metrikler için JetBrains Mono (font-mono)
- 75-15-10 kuralına uy: Yüzeyleri gereksiz neon kırmızı çizgilerle boğma; cam efektini (backdrop-blur) sadece modallarda ve açılır menülerde kullan.
- Durum rozetlerinde sadece renk kullanma; ikon + metin + kontrastlı zemin üçlüsünü sağla (WCAG 2.2 AA).
- Tüm etkileşimli elemanlarda hover (-translate-y-0.5), active (scale-98) ve loading/empty durumlarını eksiksiz hazırla.
```

---

## 19. Nihai Tasarım İlkesi (Final Design Principle)

> 🚀 **"Make complex enterprise workflows feel simple."**  
> *(Karmaşık kurumsal iş akışlarını basit ve zahmetsiz hissettir.)*

UI **modern olmalı**, ama modaya bağımlı olmamalıdır.  
Estetik **işlevi desteklemeli**, ama işlevin önüne geçmemelidir.  
Görsel efektler **hiyerarşi oluşturmalı**, ama dikkat dağıtmamalıdır.

AI Agent'ın nihai hedefi yalnızca *"güzel bir şey tasarlamak"* değil:  
> **"Net, güvenilir, erişilebilir ve son derece verimli bir sistem kurmak — ardından onu mükemmel bir estetikle taçlandırmaktır."**
