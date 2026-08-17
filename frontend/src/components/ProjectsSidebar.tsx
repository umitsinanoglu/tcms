'use client';

import React, { useState } from 'react';
import { Project } from '@/services/api';
import {
  FolderKanban,
  Search,
  PlusCircle,
  ChevronRight,
  ExternalLink,
  Layers,
  Sparkles,
} from 'lucide-react';

interface ProjectsSidebarProps {
  projects: Project[];
  selectedProject: Project | null;
  onSelectProject: (project: Project) => void;
  onOpenNewProject: () => void;
  onEditProject?: (project: Project) => void;
}

export const ProjectsSidebar: React.FC<ProjectsSidebarProps> = ({
  projects,
  selectedProject,
  onSelectProject,
  onOpenNewProject,
  onEditProject,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <aside className="w-80 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex flex-col h-[calc(100vh-4rem)] select-none transition-colors duration-200">
      {/* Sidebar Header */}
      <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FolderKanban className="w-4 h-4 text-rose-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Test Planları Navigasyonu
            </h2>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold border border-slate-200 dark:border-slate-700">
            {projects.length} Test Planı
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Test planı veya anahtar ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-rose-500 transition-colors"
          />
        </div>
      </div>

      {/* Projects List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {filteredProjects.length === 0 ? (
          <div className="text-center py-10 px-4 text-slate-400 dark:text-slate-500 text-xs">
            <Layers className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
            <p>Test planı bulunamadı.</p>
          </div>
        ) : (
          filteredProjects.map((p) => {
            const isSelected = selectedProject?.id === p.id;
            return (
              <div
                key={p.id}
                onClick={() => onSelectProject(p)}
                className={`group p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 relative ${
                  isSelected
                    ? 'bg-rose-500/10 dark:bg-rose-500/15 border-rose-500/40 text-slate-900 dark:text-white shadow-sm'
                    : 'bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800/60 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2 min-w-0">
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 shrink-0">
                      [{p.key}]
                    </span>
                    <h3 className="text-xs font-bold truncate group-hover:text-rose-500 transition-colors">
                      {p.name}
                    </h3>
                  </div>
                  <div className="flex items-center space-x-1 shrink-0">
                    {onEditProject && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditProject(p);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded transition-all"
                        title="Test Planını Düzenle / Sil"
                      >
                        <FolderKanban className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <ChevronRight
                      className={`w-3.5 h-3.5 transition-transform ${
                        isSelected ? 'text-rose-500 translate-x-0.5' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'
                      }`}
                    />
                  </div>
                </div>

                {p.description && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {p.description}
                  </p>
                )}

                {p.jiraProjectKey && (
                  <div className="flex items-center space-x-1 text-[10px] font-mono text-blue-500 dark:text-blue-400">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>Jira: {p.jiraProjectKey}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer New Project Button */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800">
        <button
          onClick={onOpenNewProject}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl transition-all shadow-sm"
        >
          <PlusCircle className="w-4 h-4 text-rose-500" />
          <span>+ Yeni Test Planı Ekle</span>
        </button>
      </div>
    </aside>
  );
};
