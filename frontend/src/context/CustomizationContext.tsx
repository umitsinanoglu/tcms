'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  SettingsService,
  FieldCustomizationState,
  ModuleGridConfig,
  GridColumnConfig,
  TableDensity,
} from '@/services/api';

const STORAGE_KEY = 'tcms_field_customizations_v2';

export const DEFAULT_FIELD_CUSTOMIZATIONS: FieldCustomizationState = {
  modules: {
    'test-plans': {
      moduleId: 'test-plans',
      moduleName: 'Test Planları',
      density: 'normal',
      defaultSortBy: 'createdAt',
      defaultSortOrder: 'desc',
      columns: [
        { id: 'title', label: 'Test Planı', defaultLabel: 'Test Planı', visible: true, order: 0, width: '260px', align: 'left', sortable: true, isSticky: 'left', isSystem: true, description: 'Test planı başlığı, açıklaması ve simgesi' },
        { id: 'type', label: 'Tür', defaultLabel: 'Tür', visible: true, order: 1, width: '84px', align: 'center', sortable: true, description: 'Test türü / platform kategorisi (Web, Mobil, vb.)' },
        { id: 'scope', label: 'Kapsam', defaultLabel: 'Kapsam', visible: true, order: 2, width: '150px', align: 'left', sortable: true, description: 'Planın kapsadığı iş birimleri ve modüller' },
        { id: 'scenariosCount', label: 'Senaryo', defaultLabel: 'Senaryo', visible: true, order: 3, width: '76px', align: 'center', sortable: true, description: 'Bağlı test senaryosu adedi' },
        { id: 'passRate', label: 'Başarı Oranı', defaultLabel: 'Başarı Oranı', visible: true, order: 4, width: '120px', align: 'left', sortable: true, description: 'Plan genelindeki son başarı yüzdesi ve grafik barı' },
        { id: 'status', label: 'Durum', defaultLabel: 'Durum', visible: true, order: 5, width: '100px', align: 'center', sortable: true, description: 'Planın aktiflik / tamamlanma statüsü' },
        { id: 'lastRun', label: 'Son Çalıştırma', defaultLabel: 'Son Çalıştırma', visible: true, order: 6, width: '130px', align: 'left', sortable: true, description: 'En son tetiklenme veya güncelleme tarihi' },
        { id: 'actions', label: 'İşlemler', defaultLabel: 'İşlemler', visible: true, order: 7, width: '90px', align: 'right', sortable: false, isSticky: 'right', isSystem: true, description: 'Koş, Düzenle, Sil butonları' },
      ],
    },
    'test-cases': {
      moduleId: 'test-cases',
      moduleName: 'Test Senaryoları',
      density: 'normal',
      defaultSortBy: 'code',
      defaultSortOrder: 'asc',
      columns: [
        { id: 'code', label: 'Senaryo Kodu', defaultLabel: 'Senaryo Kodu', visible: true, order: 0, width: '110px', align: 'left', sortable: true, isSticky: 'left', isSystem: true, description: 'Benzersiz senaryo kimliği (TC-101)' },
        { id: 'title', label: 'Senaryo Başlığı', defaultLabel: 'Senaryo Başlığı', visible: true, order: 1, width: '280px', align: 'left', sortable: true, isSystem: true, description: 'Test senaryosunun başlığı ve açıklaması' },
        { id: 'type', label: 'Tip', defaultLabel: 'Tip', visible: true, order: 2, width: '85px', align: 'center', sortable: true, description: 'Web, Mobil, API, Performans' },
        { id: 'executionType', label: 'Koşum Türü', defaultLabel: 'Koşum Türü', visible: true, order: 3, width: '95px', align: 'center', sortable: true, description: 'MANUAL veya AUTOMATED' },
        { id: 'priority', label: 'Öncelik', defaultLabel: 'Öncelik', visible: true, order: 4, width: '95px', align: 'center', sortable: true, description: 'Kritiklik derecesi (Blocker, Normal, Low)' },
        { id: 'jiraStoryKey', label: 'Jira Story', defaultLabel: 'Jira Story', visible: true, order: 5, width: '110px', align: 'left', sortable: true, description: 'Bağlı Jira Story / Epic referansı' },
        { id: 'stepsCount', label: 'Adım Sayısı', defaultLabel: 'Adım Sayısı', visible: true, order: 6, width: '80px', align: 'center', sortable: true, description: 'Senaryo adım adedi' },
        { id: 'lastResult', label: 'Son Durum', defaultLabel: 'Son Durum', visible: true, order: 7, width: '100px', align: 'center', sortable: true, description: 'En son icra edilen test sonucu' },
        { id: 'updatedAt', label: 'Güncellenme', defaultLabel: 'Güncellenme', visible: false, order: 8, width: '120px', align: 'left', sortable: true, description: 'Son değişiklik zaman damgası' },
        { id: 'actions', label: 'İşlemler', defaultLabel: 'İşlemler', visible: true, order: 9, width: '100px', align: 'right', sortable: false, isSticky: 'right', isSystem: true, description: 'Koş, Detay, Düzenle, Sil' },
      ],
    },
    'test-runs': {
      moduleId: 'test-runs',
      moduleName: 'Test Koşumları',
      density: 'normal',
      defaultSortBy: 'createdAt',
      defaultSortOrder: 'desc',
      columns: [
        { id: 'title', label: 'Koşum Başlığı', defaultLabel: 'Koşum Başlığı', visible: true, order: 0, width: '260px', align: 'left', sortable: true, isSticky: 'left', isSystem: true, description: 'Koşum adı, tipi ve plan bağlantısı' },
        { id: 'status', label: 'Durum', defaultLabel: 'Durum', visible: true, order: 1, width: '110px', align: 'center', sortable: true, description: 'Devam Ediyor / Tamamlandı / İptal' },
        { id: 'environment', label: 'Ortam', defaultLabel: 'Ortam', visible: true, order: 2, width: '90px', align: 'center', sortable: true, description: 'STAGING / DEV / PROD / UAT' },
        { id: 'version', label: 'Sürüm', defaultLabel: 'Sürüm', visible: true, order: 3, width: '85px', align: 'center', sortable: true, description: 'Uygulama release sürümü' },
        { id: 'executedBy', label: 'Koşan', defaultLabel: 'Koşan', visible: true, order: 4, width: '130px', align: 'left', sortable: true, description: 'Koşumu tetikleyen kullanıcı veya pipeline' },
        { id: 'metrics', label: 'İlerleme & Sonuçlar', defaultLabel: 'İlerleme & Sonuçlar', visible: true, order: 5, width: '180px', align: 'left', sortable: false, description: 'Başarılı/Hatalı/Atlanan dağılım çubuğu' },
        { id: 'duration', label: 'Süre', defaultLabel: 'Süre', visible: false, order: 6, width: '80px', align: 'center', sortable: true, description: 'Toplam icra müddeti' },
        { id: 'createdAt', label: 'Tarih', defaultLabel: 'Tarih', visible: true, order: 7, width: '120px', align: 'left', sortable: true, description: 'Koşum oluşturulma zamanı' },
        { id: 'actions', label: 'İşlemler', defaultLabel: 'İşlemler', visible: true, order: 8, width: '110px', align: 'right', sortable: false, isSticky: 'right', isSystem: true, description: 'Detay, Canlı Terminal, Rerun' },
      ],
    },
    'defects': {
      moduleId: 'defects',
      moduleName: 'Defektler',
      density: 'normal',
      defaultSortBy: 'createdAt',
      defaultSortOrder: 'desc',
      columns: [
        { id: 'key', label: 'Defekt No', defaultLabel: 'Defekt No', visible: true, order: 0, width: '95px', align: 'left', sortable: true, isSticky: 'left', isSystem: true, description: 'Benzersiz hata anahtarı (DEF-101)' },
        { id: 'title', label: 'Defekt Başlığı', defaultLabel: 'Defekt Başlığı', visible: true, order: 1, width: '280px', align: 'left', sortable: true, isSystem: true, description: 'Hatanın özeti ve detayları' },
        { id: 'severity', label: 'Önem Derecesi', defaultLabel: 'Önem Derecesi', visible: true, order: 2, width: '110px', align: 'center', sortable: true, description: 'Blocker, Critical, Major, Minor, Trivial' },
        { id: 'status', label: 'Durum', defaultLabel: 'Durum', visible: true, order: 3, width: '110px', align: 'center', sortable: true, description: 'Open, In Progress, Resolved, Closed' },
        { id: 'assignedTo', label: 'Atanan', defaultLabel: 'Atanan', visible: true, order: 4, width: '120px', align: 'left', sortable: true, description: 'Çözümden sorumlu kişi' },
        { id: 'reportedBy', label: 'Bildiren', defaultLabel: 'Bildiren', visible: false, order: 5, width: '120px', align: 'left', sortable: true, description: 'Hatayı sisteme giren kişi' },
        { id: 'environment', label: 'Ortam', defaultLabel: 'Ortam', visible: true, order: 6, width: '90px', align: 'center', sortable: true, description: 'Ortam bilgisi' },
        { id: 'jiraBugKey', label: 'Jira Link', defaultLabel: 'Jira Link', visible: true, order: 7, width: '100px', align: 'left', sortable: true, description: 'Jira hata entegrasyon linki' },
        { id: 'createdAt', label: 'Oluşturulma', defaultLabel: 'Oluşturulma', visible: true, order: 8, width: '120px', align: 'left', sortable: true, description: 'Kayıt açılış tarihi' },
        { id: 'actions', label: 'İşlemler', defaultLabel: 'İşlemler', visible: true, order: 9, width: '90px', align: 'right', sortable: false, isSticky: 'right', isSystem: true, description: 'Görüntüle, Çözüldü yap, Sil' },
      ],
    },
  },
  customTags: ['Regresyon', 'Smoke', 'Kritik', 'Ödeme', 'Mobil Bankacılık', 'Core Banking', 'Güvenlik', 'API'],
  updatedAt: new Date().toISOString(),
};

interface CustomizationContextType {
  customizationState: FieldCustomizationState;
  isLoading: boolean;
  getModuleConfig: (moduleId: string) => ModuleGridConfig;
  getVisibleColumns: (moduleId: string) => GridColumnConfig[];
  isColumnVisible: (moduleId: string, columnId: string) => boolean;
  toggleColumnVisibility: (moduleId: string, columnId: string) => void;
  setColumnVisibility: (moduleId: string, columnId: string, visible: boolean) => void;
  updateColumn: (moduleId: string, columnId: string, updates: Partial<GridColumnConfig>) => void;
  reorderColumns: (moduleId: string, sourceIndex: number, destinationIndex: number) => void;
  moveColumnUp: (moduleId: string, columnId: string) => void;
  moveColumnDown: (moduleId: string, columnId: string) => void;
  setModuleDensity: (moduleId: string, density: TableDensity) => void;
  setModuleSort: (moduleId: string, sortBy: string, sortOrder: 'asc' | 'desc') => void;
  addCustomTag: (tag: string) => void;
  removeCustomTag: (tag: string) => void;
  resetModuleToDefault: (moduleId?: string) => Promise<void>;
  saveCustomizations: (stateToSave?: FieldCustomizationState) => Promise<void>;
  getDensityClasses: (density?: TableDensity) => { pyTh: string; pyTd: string; textClass: string };
}

const CustomizationContext = createContext<CustomizationContextType | undefined>(undefined);

export const CustomizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customizationState, setCustomizationState] = useState<FieldCustomizationState>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          return {
            ...DEFAULT_FIELD_CUSTOMIZATIONS,
            ...parsed,
            modules: {
              ...DEFAULT_FIELD_CUSTOMIZATIONS.modules,
              ...(parsed.modules || {}),
            },
          };
        }
      } catch (e) {
        console.warn('Failed to parse cached field customizations:', e);
      }
    }
    return DEFAULT_FIELD_CUSTOMIZATIONS;
  });

  const [isLoading, setIsLoading] = useState(false);

  // Sync with backend on mount
  useEffect(() => {
    let isMounted = true;
    const fetchRemote = async () => {
      try {
        setIsLoading(true);
        const remote = await SettingsService.getFieldCustomizations();
        if (remote && isMounted) {
          setCustomizationState((prev) => {
            const merged: FieldCustomizationState = {
              ...DEFAULT_FIELD_CUSTOMIZATIONS,
              ...prev,
              ...remote,
              modules: {
                ...DEFAULT_FIELD_CUSTOMIZATIONS.modules,
                ...(prev.modules || {}),
                ...(remote.modules || {}),
              },
            };
            if (typeof window !== 'undefined') {
              try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
              } catch {}
            }
            return merged;
          });
        }
      } catch (err) {
        // Backend might be offline or endpoint not yet loaded; local cache is active
        console.warn('Backend field customizations fetch deferred, using local cache');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchRemote();
    return () => {
      isMounted = false;
    };
  }, []);

  // Save changes locally and remotely
  const persistState = useCallback(async (state: FieldCustomizationState) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (err) {
        console.error('Failed to write to localStorage:', err);
      }
    }

    try {
      await SettingsService.updateFieldCustomizations(state);
    } catch (err) {
      // Ignore network errors in offline/local dev
    }
  }, []);

  const saveCustomizations = useCallback(
    async (stateToSave?: FieldCustomizationState) => {
      const target = stateToSave || customizationState;
      await persistState(target);
    },
    [customizationState, persistState],
  );

  const getModuleConfig = useCallback(
    (moduleId: string): ModuleGridConfig => {
      return (
        customizationState.modules[moduleId] ||
        DEFAULT_FIELD_CUSTOMIZATIONS.modules[moduleId] || {
          moduleId,
          moduleName: moduleId,
          density: 'normal',
          columns: [],
        }
      );
    },
    [customizationState.modules],
  );

  const getVisibleColumns = useCallback(
    (moduleId: string): GridColumnConfig[] => {
      const config = getModuleConfig(moduleId);
      return [...config.columns]
        .filter((col) => col.visible)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    },
    [getModuleConfig],
  );

  const isColumnVisible = useCallback(
    (moduleId: string, columnId: string): boolean => {
      const config = getModuleConfig(moduleId);
      const col = config.columns.find((c) => c.id === columnId);
      return col ? col.visible : true;
    },
    [getModuleConfig],
  );

  const toggleColumnVisibility = useCallback(
    (moduleId: string, columnId: string) => {
      setCustomizationState((prev) => {
        const moduleCfg = prev.modules[moduleId] || DEFAULT_FIELD_CUSTOMIZATIONS.modules[moduleId];
        if (!moduleCfg) return prev;

        const updatedCols = moduleCfg.columns.map((c) => {
          if (c.id === columnId) {
            return { ...c, visible: !c.visible };
          }
          return c;
        });

        const nextState: FieldCustomizationState = {
          ...prev,
          modules: {
            ...prev.modules,
            [moduleId]: {
              ...moduleCfg,
              columns: updatedCols,
            },
          },
          updatedAt: new Date().toISOString(),
        };

        persistState(nextState);
        return nextState;
      });
    },
    [persistState],
  );

  const setColumnVisibility = useCallback(
    (moduleId: string, columnId: string, visible: boolean) => {
      setCustomizationState((prev) => {
        const moduleCfg = prev.modules[moduleId] || DEFAULT_FIELD_CUSTOMIZATIONS.modules[moduleId];
        if (!moduleCfg) return prev;

        const updatedCols = moduleCfg.columns.map((c) => {
          if (c.id === columnId) {
            return { ...c, visible };
          }
          return c;
        });

        const nextState: FieldCustomizationState = {
          ...prev,
          modules: {
            ...prev.modules,
            [moduleId]: {
              ...moduleCfg,
              columns: updatedCols,
            },
          },
          updatedAt: new Date().toISOString(),
        };

        persistState(nextState);
        return nextState;
      });
    },
    [persistState],
  );

  const updateColumn = useCallback(
    (moduleId: string, columnId: string, updates: Partial<GridColumnConfig>) => {
      setCustomizationState((prev) => {
        const moduleCfg = prev.modules[moduleId] || DEFAULT_FIELD_CUSTOMIZATIONS.modules[moduleId];
        if (!moduleCfg) return prev;

        const updatedCols = moduleCfg.columns.map((c) => {
          if (c.id === columnId) {
            return { ...c, ...updates };
          }
          return c;
        });

        const nextState: FieldCustomizationState = {
          ...prev,
          modules: {
            ...prev.modules,
            [moduleId]: {
              ...moduleCfg,
              columns: updatedCols,
            },
          },
          updatedAt: new Date().toISOString(),
        };

        persistState(nextState);
        return nextState;
      });
    },
    [persistState],
  );

  const reorderColumns = useCallback(
    (moduleId: string, sourceIndex: number, destinationIndex: number) => {
      setCustomizationState((prev) => {
        const moduleCfg = prev.modules[moduleId] || DEFAULT_FIELD_CUSTOMIZATIONS.modules[moduleId];
        if (!moduleCfg) return prev;

        const cols = [...moduleCfg.columns].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        const [moved] = cols.splice(sourceIndex, 1);
        cols.splice(destinationIndex, 0, moved);

        const reindexed = cols.map((col, idx) => ({
          ...col,
          order: idx,
        }));

        const nextState: FieldCustomizationState = {
          ...prev,
          modules: {
            ...prev.modules,
            [moduleId]: {
              ...moduleCfg,
              columns: reindexed,
            },
          },
          updatedAt: new Date().toISOString(),
        };

        persistState(nextState);
        return nextState;
      });
    },
    [persistState],
  );

  const moveColumnUp = useCallback(
    (moduleId: string, columnId: string) => {
      setCustomizationState((prev) => {
        const moduleCfg = prev.modules[moduleId] || DEFAULT_FIELD_CUSTOMIZATIONS.modules[moduleId];
        if (!moduleCfg) return prev;

        const sorted = [...moduleCfg.columns].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        const idx = sorted.findIndex((c) => c.id === columnId);
        if (idx <= 0) return prev;

        const target = sorted[idx];
        const previous = sorted[idx - 1];
        sorted[idx - 1] = target;
        sorted[idx] = previous;

        const reindexed = sorted.map((col, i) => ({ ...col, order: i }));

        const nextState: FieldCustomizationState = {
          ...prev,
          modules: {
            ...prev.modules,
            [moduleId]: {
              ...moduleCfg,
              columns: reindexed,
            },
          },
          updatedAt: new Date().toISOString(),
        };

        persistState(nextState);
        return nextState;
      });
    },
    [persistState],
  );

  const moveColumnDown = useCallback(
    (moduleId: string, columnId: string) => {
      setCustomizationState((prev) => {
        const moduleCfg = prev.modules[moduleId] || DEFAULT_FIELD_CUSTOMIZATIONS.modules[moduleId];
        if (!moduleCfg) return prev;

        const sorted = [...moduleCfg.columns].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        const idx = sorted.findIndex((c) => c.id === columnId);
        if (idx < 0 || idx >= sorted.length - 1) return prev;

        const target = sorted[idx];
        const next = sorted[idx + 1];
        sorted[idx + 1] = target;
        sorted[idx] = next;

        const reindexed = sorted.map((col, i) => ({ ...col, order: i }));

        const nextState: FieldCustomizationState = {
          ...prev,
          modules: {
            ...prev.modules,
            [moduleId]: {
              ...moduleCfg,
              columns: reindexed,
            },
          },
          updatedAt: new Date().toISOString(),
        };

        persistState(nextState);
        return nextState;
      });
    },
    [persistState],
  );

  const setModuleDensity = useCallback(
    (moduleId: string, density: TableDensity) => {
      setCustomizationState((prev) => {
        const moduleCfg = prev.modules[moduleId] || DEFAULT_FIELD_CUSTOMIZATIONS.modules[moduleId];
        if (!moduleCfg) return prev;

        const nextState: FieldCustomizationState = {
          ...prev,
          modules: {
            ...prev.modules,
            [moduleId]: {
              ...moduleCfg,
              density,
            },
          },
          updatedAt: new Date().toISOString(),
        };

        persistState(nextState);
        return nextState;
      });
    },
    [persistState],
  );

  const setModuleSort = useCallback(
    (moduleId: string, sortBy: string, sortOrder: 'asc' | 'desc') => {
      setCustomizationState((prev) => {
        const moduleCfg = prev.modules[moduleId] || DEFAULT_FIELD_CUSTOMIZATIONS.modules[moduleId];
        if (!moduleCfg) return prev;

        const nextState: FieldCustomizationState = {
          ...prev,
          modules: {
            ...prev.modules,
            [moduleId]: {
              ...moduleCfg,
              defaultSortBy: sortBy,
              defaultSortOrder: sortOrder,
            },
          },
          updatedAt: new Date().toISOString(),
        };

        persistState(nextState);
        return nextState;
      });
    },
    [persistState],
  );

  const addCustomTag = useCallback(
    (tag: string) => {
      const clean = tag.trim();
      if (!clean) return;

      setCustomizationState((prev) => {
        if (prev.customTags.includes(clean)) return prev;
        const nextState: FieldCustomizationState = {
          ...prev,
          customTags: [...prev.customTags, clean],
          updatedAt: new Date().toISOString(),
        };
        persistState(nextState);
        return nextState;
      });
    },
    [persistState],
  );

  const removeCustomTag = useCallback(
    (tag: string) => {
      setCustomizationState((prev) => {
        const nextState: FieldCustomizationState = {
          ...prev,
          customTags: prev.customTags.filter((t) => t !== tag),
          updatedAt: new Date().toISOString(),
        };
        persistState(nextState);
        return nextState;
      });
    },
    [persistState],
  );

  const resetModuleToDefault = useCallback(
    async (moduleId?: string) => {
      let nextState: FieldCustomizationState;
      if (moduleId && DEFAULT_FIELD_CUSTOMIZATIONS.modules[moduleId]) {
        nextState = {
          ...customizationState,
          modules: {
            ...customizationState.modules,
            [moduleId]: DEFAULT_FIELD_CUSTOMIZATIONS.modules[moduleId],
          },
          updatedAt: new Date().toISOString(),
        };
      } else {
        nextState = {
          ...DEFAULT_FIELD_CUSTOMIZATIONS,
          updatedAt: new Date().toISOString(),
        };
      }
      setCustomizationState(nextState);
      await persistState(nextState);
    },
    [customizationState, persistState],
  );

  const getDensityClasses = useCallback((density: TableDensity = 'normal') => {
    switch (density) {
      case 'compact':
        return {
          pyTh: 'py-2 px-2.5',
          pyTd: 'py-1.5 px-2.5',
          textClass: 'text-[11px]',
        };
      case 'comfortable':
        return {
          pyTh: 'py-4 px-4',
          pyTd: 'py-3.5 px-4',
          textClass: 'text-xs',
        };
      case 'normal':
      default:
        return {
          pyTh: 'py-3 px-3.5',
          pyTd: 'py-2.5 px-3.5',
          textClass: 'text-xs',
        };
    }
  }, []);

  const value = useMemo(
    () => ({
      customizationState,
      isLoading,
      getModuleConfig,
      getVisibleColumns,
      isColumnVisible,
      toggleColumnVisibility,
      setColumnVisibility,
      updateColumn,
      reorderColumns,
      moveColumnUp,
      moveColumnDown,
      setModuleDensity,
      setModuleSort,
      addCustomTag,
      removeCustomTag,
      resetModuleToDefault,
      saveCustomizations,
      getDensityClasses,
    }),
    [
      customizationState,
      isLoading,
      getModuleConfig,
      getVisibleColumns,
      isColumnVisible,
      toggleColumnVisibility,
      setColumnVisibility,
      updateColumn,
      reorderColumns,
      moveColumnUp,
      moveColumnDown,
      setModuleDensity,
      setModuleSort,
      addCustomTag,
      removeCustomTag,
      resetModuleToDefault,
      saveCustomizations,
      getDensityClasses,
    ],
  );

  return <CustomizationContext.Provider value={value}>{children}</CustomizationContext.Provider>;
};

export const useCustomization = (): CustomizationContextType => {
  const context = useContext(CustomizationContext);
  if (!context) {
    throw new Error('useCustomization must be used within a CustomizationProvider');
  }
  return context;
};
