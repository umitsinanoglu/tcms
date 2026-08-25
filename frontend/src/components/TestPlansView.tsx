import React, { useState, useEffect, useCallback } from 'react';
import { Project, TestPlan, PlanStatus, TestPlansService, UpdateTestPlanDto, CreateTestPlanDto } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { NewTestPlanModal } from './NewTestPlanModal';
import { EditTestPlanModal } from './EditTestPlanModal';
import {
  ClipboardList,
  Plus,
  Search,
  Server,
  Tag,
  Layers,
  FileText,
  Activity,
  Play,
  Pencil,
  Trash2,
  Calendar,
  Sparkles,
  CheckCircle2,
  Clock,
  Archive,
  RefreshCw,
  FolderKanban,
} from 'lucide-react';

interface TestPlansViewProps {
  project: Project | null;
  onStartRunWithPlan: (plan: TestPlan) => void;
  onNavigateToRuns?: () => void;
}

export const TestPlansView: React.FC<TestPlansViewProps> = ({
  project,
  onStartRunWithPlan,
  onNavigateToRuns,
}) => {
  const { can } = useAuth();
  const [plans, setPlans] = useState<TestPlan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals
  const [isNewPlanOpen, setIsNewPlanOpen] = useState(false);
  const [isEditPlanOpen, setIsEditPlanOpen] = useState(false);
  const [selectedPlanForEdit, setSelectedPlanForEdit] = useState<TestPlan | null>(null);

  const loadPlans = useCallback(async () => {
    if (!project?.id) return;
    setIsLoading(true);
    try {
      const data = await TestPlansService.getAllByProject(project.id);
      setPlans(data || []);
    } catch (err) {
      console.error('Failed to load test plans:', err);
      setPlans([]);
    } finally {
      setIsLoading(false);
    }
  }, [project?.id]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const handleCreatePlan = async (data: CreateTestPlanDto) => {
    await TestPlansService.create(data);
    await loadPlans();
  };

  const handleUpdatePlan = async (id: string, data: UpdateTestPlanDto) => {
    await TestPlansService.update(id, data);
    await loadPlans();
  };

  const handleDeletePlan = async (id: string) => {
    await TestPlansService.delete(id);
    await loadPlans();
  };

  const filteredPlans = plans.filter((p) => {
    const matchesSearch = searchQuery
      ? p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.version && p.version.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.scope && p.scope.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.requirements && p.requirements.toLowerCase().includes(searchQuery.toLowerCase()))
      : true;

    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: PlanStatus) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            AKTİF
          </span>
        );
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/30">
            <Clock className="w-3 h-3" />
            TASLAK
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30">
            <CheckCircle2 className="w-3 h-3" />
            TAMAMLANDI
          </span>
        );
      case 'ARCHIVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <Archive className="w-3 h-3" />
            ARŞİV
          </span>
        );
      default:
        return null;
    }
  };

  const getEnvBadge = (env: string) => {
    let colorClass = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    if (env === 'PROD') {
      colorClass = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30';
    } else if (env === 'STAGING') {
      colorClass = 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30';
    } else if (env === 'UAT') {
      colorClass = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
    }
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-mono font-bold border ${colorClass}`}>
        <Server className="w-3 h-3" />
        {env}
      </span>
    );
  };

  const activePlansCount = plans.filter((p) => p.status === 'ACTIVE').length;
  const totalRunsLinked = plans.reduce((acc, curr) => acc + (curr._count?.testRuns || curr.testRuns?.length || 0), 0);

  if (!project) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-slate-400">
        <div className="text-center space-y-3">
          <FolderKanban className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
          <p className="text-sm font-medium">Lütfen sol menüden çalışılacak bir Test Projesi seçin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50/50 dark:bg-[#0c121e]/50">
      {/* 1. Top Action Header */}
      <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#141821]/90 backdrop-blur-sm shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-[#b83a4b]/10 text-[#b83a4b]">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                  Test Planları
                </h1>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-[#b83a4b]/15 text-[#b83a4b] dark:text-[#d66b7a] border border-[#b83a4b]/20">
                  {plans.length} Plan
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              <span className="font-semibold text-slate-700 dark:text-slate-300">[{project.key}] {project.name}</span> projesine ait test planlama stratejisi, hedef ortamlar ve kapsam bileşenleri.
            </p>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={loadPlans}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1d232f] text-slate-600 dark:text-slate-300 hover:text-[#b83a4b] hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-xs"
              title="Yenile"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            {can('CREATE_PLAN' as any) || true ? (
              <button
                type="button"
                onClick={() => setIsNewPlanOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-white transition-all duration-200 rounded-xl bg-gradient-to-r from-[#b83a4b] to-[#821c2b] hover:from-[#c54859] hover:to-[#962534] shadow-md shadow-[#821c2b]/25 hover:shadow-[0_4px_12px_rgba(130,28,43,0.35)] active:scale-98 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Yeni Test Planı Oluştur</span>
              </button>
            ) : null}
          </div>
        </div>

        {/* 2. Quick Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <div className="p-3 rounded-xl bg-white dark:bg-[#1d232f] border border-slate-200 dark:border-slate-700/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Toplam Plan</span>
              <p className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">{plans.length}</p>
            </div>
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">
              <ClipboardList className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-[#1d232f] border border-slate-200 dark:border-slate-700/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Aktif Planlar</span>
              <p className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">{activePlansCount}</p>
            </div>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-[#1d232f] border border-slate-200 dark:border-slate-700/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Bağlı Koşumlar</span>
              <p className="text-lg font-bold font-mono text-[#b83a4b] dark:text-[#d66b7a]">{totalRunsLinked}</p>
            </div>
            <div className="p-2 rounded-lg bg-[#b83a4b]/10 text-[#b83a4b]">
              <Play className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-[#1d232f] border border-slate-200 dark:border-slate-700/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Proje Kodu</span>
              <p className="text-lg font-bold font-mono text-slate-800 dark:text-slate-200">[{project.key}]</p>
            </div>
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* 3. Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Test planı, sürüm, kapsam veya gereksinim ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-[#1d232f] border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#b83a4b]/30 shadow-xs"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {['ALL', 'ACTIVE', 'DRAFT', 'COMPLETED', 'ARCHIVED'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all text-xs cursor-pointer ${
                  statusFilter === st
                    ? 'bg-[#b83a4b] text-white shadow-sm'
                    : 'bg-white dark:bg-[#1d232f] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {st === 'ALL'
                  ? 'TÜMÜ'
                  : st === 'ACTIVE'
                  ? 'AKTİF'
                  : st === 'DRAFT'
                  ? 'TASLAK'
                  : st === 'COMPLETED'
                  ? 'TAMAMLANDI'
                  : 'ARŞİV'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Test Plans Grid / Cards */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-[#b83a4b]/20 border-t-[#b83a4b] rounded-full animate-spin" />
          </div>
        ) : filteredPlans.length === 0 ? (
          <div className="text-center py-16 px-4 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-[#b83a4b]/10 text-[#b83a4b] flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Test Planı Bulunamadı</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-5">
              {searchQuery || statusFilter !== 'ALL'
                ? 'Arama kriterlerinize uygun test planı bulunamadı.'
                : 'Bu projede henüz bir test planı oluşturulmamış. Yeni bir test planı tanımlayarak başlayın.'}
            </p>
            <button
              type="button"
              onClick={() => setIsNewPlanOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#b83a4b] hover:bg-[#a32f3f] shadow-md shadow-[#821c2b]/25 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>İlk Test Planını Oluştur</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredPlans.map((plan) => {
              const runCount = plan._count?.testRuns || plan.testRuns?.length || 0;
              return (
                <div
                  key={plan.id}
                  className="rounded-2xl bg-white dark:bg-[#1d232f] border border-slate-200 dark:border-slate-700/80 hover:border-[#b83a4b]/40 transition-all duration-200 shadow-xs hover:shadow-md flex flex-col justify-between overflow-hidden group"
                >
                  {/* Card Header */}
                  <div className="p-4 sm:p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {getStatusBadge(plan.status)}
                          {getEnvBadge(plan.environment)}
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            <Tag className="w-3 h-3 text-[#b83a4b]" />
                            {plan.version}
                          </span>
                        </div>
                        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#b83a4b] transition-colors leading-snug pt-1">
                          {plan.title}
                        </h2>
                      </div>

                      {/* Top Action Menu */}
                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPlanForEdit(plan);
                            setIsEditPlanOpen(true);
                          }}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                          title="Planı Düzenle"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePlan(plan.id)}
                          className="p-1.5 rounded-lg hover:bg-rose-500/15 text-slate-400 hover:text-rose-500 transition-colors"
                          title="Planı Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Description */}
                    {plan.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                        {plan.description}
                      </p>
                    )}

                    {/* Scope & Requirements Badges */}
                    {(plan.scope || plan.requirements) && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5 text-[11px]">
                        {plan.scope && (
                          <div className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-400">
                            <Layers className="w-3.5 h-3.5 text-[#b83a4b] shrink-0" />
                            <span className="truncate font-medium" title={plan.scope}>
                              Kapsam: <span className="text-slate-800 dark:text-slate-200">{plan.scope}</span>
                            </span>
                          </div>
                        )}
                        {plan.requirements && (
                          <div className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-400">
                            <FileText className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            <span className="truncate font-mono" title={plan.requirements}>
                              Jira / Req: <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{plan.requirements}</span>
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Footer: Linked Runs & Launch Button */}
                  <div className="p-3.5 sm:px-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-[#141821]/60 flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                      <Activity className="w-3.5 h-3.5 text-[#b83a4b]" />
                      <span>{runCount} Koşum</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onStartRunWithPlan(plan)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#b83a4b] to-[#821c2b] hover:from-[#c54859] hover:to-[#962534] shadow-sm hover:shadow-md transition-all active:scale-98 cursor-pointer"
                      title="Bu test planı ile yeni koşum başlat"
                    >
                      <Play className="w-3 h-3 fill-white" />
                      <span>Koşum Başlat</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <NewTestPlanModal
        isOpen={isNewPlanOpen}
        onClose={() => setIsNewPlanOpen(false)}
        projectId={project.id}
        projectName={project.name}
        projectKey={project.key}
        onSubmit={handleCreatePlan}
      />

      <EditTestPlanModal
        isOpen={isEditPlanOpen}
        onClose={() => {
          setIsEditPlanOpen(false);
          setSelectedPlanForEdit(null);
        }}
        plan={selectedPlanForEdit}
        onUpdate={handleUpdatePlan}
        onDelete={handleDeletePlan}
      />
    </div>
  );
};
