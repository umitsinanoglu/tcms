'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useCustomization } from '@/context/CustomizationContext';
import { TableDensity } from '@/services/api';
import {
  SlidersHorizontal,
  Check,
  ChevronDown,
  RotateCcw,
  Search,
  ArrowUp,
  ArrowDown,
  Settings2,
  Lock,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Grid,
} from 'lucide-react';
import { AdvancedFieldCustomizationModal } from './AdvancedFieldCustomizationModal';

interface ColumnCustomizerMenuProps {
  moduleId: string;
  className?: string;
  onOpenAdvancedSettings?: () => void;
  align?: 'left' | 'right';
}

export const ColumnCustomizerMenu: React.FC<ColumnCustomizerMenuProps> = ({
  moduleId,
  className = '',
  onOpenAdvancedSettings,
  align = 'right',
}) => {
  const {
    getModuleConfig,
    toggleColumnVisibility,
    setColumnVisibility,
    moveColumnUp,
    moveColumnDown,
    setModuleDensity,
    resetModuleToDefault,
  } = useCustomization();

  const [isOpen, setIsOpen] = useState(false);
  const [isAdvancedModalOpen, setIsAdvancedModalOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  const config = getModuleConfig(moduleId);
  const allColumns = [...config.columns].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const visibleCount = allColumns.filter((c) => c.visible).length;

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const filteredColumns = allColumns.filter(
    (c) =>
      c.label.toLowerCase().includes(searchFilter.toLowerCase().trim()) ||
      (c.defaultLabel && c.defaultLabel.toLowerCase().includes(searchFilter.toLowerCase().trim())) ||
      c.id.toLowerCase().includes(searchFilter.toLowerCase().trim()),
  );

  const handleSelectAll = (select: boolean) => {
    allColumns.forEach((c) => {
      if (!c.isSystem) {
        setColumnVisibility(moduleId, c.id, select);
      }
    });
  };

  const handleReset = async () => {
    await resetModuleToDefault(moduleId);
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={menuRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
          isOpen
            ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)] text-[var(--accent-primary)] shadow-sm'
            : 'bg-white dark:bg-[#161f30] border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs'
        }`}
        title="Tablo kolonlarını ve görünümünü özelleştir"
      >
        <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 group-hover:text-inherit" />
        <span>Kolonlar</span>
        <span className="px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300">
          {visibleCount}/{allColumns.length}
        </span>
        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover Card */}
      {isOpen && (
        <div
          className={`absolute ${
            align === 'right' ? 'right-0' : 'left-0'
          } mt-2 w-72 sm:w-80 rounded-2xl bg-white dark:bg-[#192233] border border-slate-200 dark:border-slate-700/90 shadow-2xl shadow-slate-900/15 dark:shadow-black/50 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150`}
        >
          {/* Popover Header */}
          <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-lg bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] flex items-center justify-center">
                <Grid className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Kolon Özelleştirme</h4>
                <p className="text-[10px] text-slate-400">{config.moduleName} tablosu</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="flex items-center space-x-1 text-[11px] font-medium text-slate-400 hover:text-[var(--accent-primary)] dark:hover:text-[var(--accent-primary)] transition-colors cursor-pointer"
              title="Varsayılan kolon düzenine dön"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Sıfırla</span>
            </button>
          </div>

          {/* Density Selector Pills */}
          <div className="px-3 pt-2.5 pb-2 bg-slate-50/70 dark:bg-[#141b29]/70 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Satır Yoğunluğu</span>
            <div className="flex items-center bg-slate-200/70 dark:bg-slate-800 p-0.5 rounded-lg text-[10px] font-semibold">
              {(
                [
                  { id: 'compact' as TableDensity, label: 'Kompakt' },
                  { id: 'normal' as TableDensity, label: 'Standart' },
                  { id: 'comfortable' as TableDensity, label: 'Rahat' },
                ] as const
              ).map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setModuleDensity(moduleId, d.id)}
                  className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                    config.density === d.id
                      ? 'bg-white dark:bg-[#1f2a3f] text-slate-900 dark:text-slate-100 shadow-xs font-bold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search Box */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-800/80">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Kolon ara..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-[#131926] border-none focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)] text-slate-800 dark:text-slate-200 placeholder-slate-400"
              />
            </div>
          </div>

          {/* Quick Actions Strip */}
          <div className="px-3 py-1.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800/60">
            <span>{visibleCount} kolon görünür</span>
            <div className="space-x-2">
              <button
                type="button"
                onClick={() => handleSelectAll(true)}
                className="text-[var(--accent-primary)] hover:underline font-medium cursor-pointer"
              >
                Tümü
              </button>
              <span>&bull;</span>
              <button
                type="button"
                onClick={() => handleSelectAll(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-medium cursor-pointer"
              >
                Temizle
              </button>
            </div>
          </div>

          {/* Columns Scrollable List */}
          <div className="max-h-56 overflow-y-auto p-1.5 space-y-0.5">
            {filteredColumns.map((col, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === filteredColumns.length - 1;

              return (
                <div
                  key={col.id}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors ${
                    col.visible
                      ? 'bg-slate-50/90 dark:bg-slate-800/40 text-slate-800 dark:text-slate-200'
                      : 'text-slate-400 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 opacity-70'
                  }`}
                >
                  {/* Left: Checkbox + Label */}
                  <label className="flex items-center space-x-2.5 min-w-0 flex-1 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={col.visible}
                      disabled={col.isSystem}
                      onChange={() => toggleColumnVisibility(moduleId, col.id)}
                      className="rounded border-slate-300 dark:border-slate-600 text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]/30 w-3.5 h-3.5 cursor-pointer disabled:opacity-50"
                    />
                    <div className="min-w-0 flex-1 flex items-center space-x-1.5">
                      <span className={`truncate ${col.visible ? 'font-semibold' : 'line-through text-slate-400'}`}>
                        {col.label}
                      </span>
                      {col.isSystem && (
                        <span title="Sistem zorunlu kolonu">
                          <Lock className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                        </span>
                      )}
                    </div>
                  </label>

                  {/* Right: Reorder Up / Down */}
                  <div className="flex items-center space-x-0.5 shrink-0 ml-2">
                    <button
                      type="button"
                      disabled={isFirst}
                      onClick={() => moveColumnUp(moduleId, col.id)}
                      className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 cursor-pointer"
                      title="Yukarı taşı"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      disabled={isLast}
                      onClick={() => moveColumnDown(moduleId, col.id)}
                      className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 cursor-pointer"
                      title="Aşağı taşı"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer with Gelişmiş Alan Yapılandırması button */}
          <div className="p-2.5 bg-slate-50 dark:bg-[#141b29] border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                if (onOpenAdvancedSettings) {
                  onOpenAdvancedSettings();
                } else {
                  setIsAdvancedModalOpen(true);
                }
              }}
              className="w-full flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-xl bg-slate-200/80 dark:bg-slate-800 hover:bg-[var(--accent-primary)] hover:text-white dark:hover:bg-[var(--accent-primary)] text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all cursor-pointer group"
            >
              <Settings2 className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors" />
              <span>Gelişmiş Alan Yapılandırması</span>
            </button>
          </div>
        </div>
      )}

      {/* Advanced Field & Table Customization Modal */}
      <AdvancedFieldCustomizationModal
        isOpen={isAdvancedModalOpen}
        initialModuleId={moduleId}
        onClose={() => setIsAdvancedModalOpen(false)}
      />
    </div>
  );
};
