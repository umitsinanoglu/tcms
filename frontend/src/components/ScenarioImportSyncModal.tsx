'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  FileCode2,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
  ArrowRight,
  RefreshCw,
  Info,
  Check,
  Download,
  Terminal,
  Cpu,
  Smartphone,
  Play,
  FileSpreadsheet,
  HelpCircle,
  Eye,
  CheckSquare,
  Square,
  FolderTree,
  Tag,
  ExternalLink,
} from 'lucide-react';
import {
  TestCase,
  TestCasesService,
  BulkTestCaseItemInput,
  TACService,
  TACSpecItem,
  TACDevice,
  WebhooksService,
  TestRun,
  SuitesService,
  SuiteTreeNode,
} from '@/services/api';
import {
  parseCucumberFeature,
  parsePlaywrightTest,
  ParsedScenarioItem,
  ParsedScenarioFile,
  smartMatchSuite,
} from '@/utils/scenarioParsers';
import {
  downloadTestCaseTemplate,
  parseTestCasesExcel,
} from '@/utils/excelUtils';

export type SyncTab = 'CUCUMBER' | 'PLAYWRIGHT' | 'TAC' | 'EXCEL';

interface ScenarioImportSyncModalProps {
  isOpen: boolean;
  initialTab?: SyncTab;
  projectId: string;
  projectName?: string;
  existingCases?: TestCase[];
  onClose: () => void;
  onSuccess: () => Promise<void> | void;
  onOpenAutomationModal?: () => void;
}

export const ScenarioImportSyncModal: React.FC<ScenarioImportSyncModalProps> = ({
  isOpen,
  initialTab = 'CUCUMBER',
  projectId,
  projectName = 'Proje',
  existingCases = [],
  onClose,
  onSuccess,
  onOpenAutomationModal,
}) => {
  const [activeTab, setActiveTab] = useState<SyncTab>(initialTab);
  const [updateIfExists, setUpdateIfExists] = useState<boolean>(true);

  // Common Import State
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [resultSummary, setResultSummary] = useState<{
    success: boolean;
    total: number;
    createdCount: number;
    updatedCount: number;
    message?: string;
  } | null>(null);

  // Cucumber State
  const cucumberFileInputRef = useRef<HTMLInputElement | null>(null);
  const [cucumberText, setCucumberText] = useState<string>('');
  const [cucumberParsed, setCucumberParsed] = useState<ParsedScenarioFile | null>(null);
  const [cucumberFileNames, setCucumberFileNames] = useState<string[]>([]);

  // Playwright State
  const playwrightFileInputRef = useRef<HTMLInputElement | null>(null);
  const [playwrightText, setPlaywrightText] = useState<string>('');
  const [playwrightParsed, setPlaywrightParsed] = useState<ParsedScenarioFile | null>(null);
  const [playwrightFileName, setPlaywrightFileName] = useState<string>('');

  // TAC State
  const [tacOnline, setTacOnline] = useState<boolean | null>(null);
  const [tacChecking, setTacChecking] = useState<boolean>(false);
  const [tacSpecs, setTacSpecs] = useState<TACSpecItem[]>([]);
  const [tacLoadingSpecs, setTacLoadingSpecs] = useState<boolean>(false);
  const [tacSelectedSpecs, setTacSelectedSpecs] = useState<string[]>([]);
  const [tacSyncMode, setTacSyncMode] = useState<'SYNC_CASES' | 'TRIGGER_RUN'>('SYNC_CASES');

  // Excel State
  const excelFileInputRef = useRef<HTMLInputElement | null>(null);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelParsedCases, setExcelParsedCases] = useState<BulkTestCaseItemInput[]>([]);
  const [excelErrors, setExcelErrors] = useState<{ row: number; message: string }[]>([]);

  // Filter preview state
  const [previewFilter, setPreviewFilter] = useState<'ALL' | 'NEW' | 'UPDATE'>('ALL');

  // Project Suites for Smart Module Detection
  const [projectSuites, setProjectSuites] = useState<SuiteTreeNode[]>([]);

  useEffect(() => {
    if (isOpen && projectId) {
      SuitesService.getAllByProject(projectId)
        .then((suites) => setProjectSuites(suites || []))
        .catch(() => setProjectSuites([]));
    }
  }, [isOpen, projectId]);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setResultSummary(null);
      if (initialTab === 'TAC' || activeTab === 'TAC') {
        checkTacHealth();
        loadTacSpecs();
      }
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (activeTab === 'TAC') {
      checkTacHealth();
      loadTacSpecs();
    }
  }, [activeTab]);

  if (!isOpen) return null;

  // -------------------------------------------------------------
  // TAC Handlers
  // -------------------------------------------------------------
  const checkTacHealth = async () => {
    setTacChecking(true);
    try {
      const res = await TACService.checkHealth();
      setTacOnline(res.online);
    } catch {
      setTacOnline(false);
    } finally {
      setTacChecking(false);
    }
  };

  const loadTacSpecs = async () => {
    setTacLoadingSpecs(true);
    try {
      const res = await TACService.getSpecs();
      if (res.success && res.data) {
        setTacSpecs(res.data);
        // Default select all specs
        setTacSelectedSpecs(res.data.map((s) => s.relativePath));
      }
    } catch (err) {
      console.error('TAC Specs could not be loaded:', err);
    } finally {
      setTacLoadingSpecs(false);
    }
  };

  const handleToggleTacSpec = (path: string) => {
    setTacSelectedSpecs((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );
  };

  const handleSelectAllTacSpecs = (select: boolean) => {
    if (select) {
      setTacSelectedSpecs(tacSpecs.map((s) => s.relativePath));
    } else {
      setTacSelectedSpecs([]);
    }
  };

  const handleSyncTacSpecsToCases = async () => {
    if (tacSelectedSpecs.length === 0) {
      alert('Lütfen senkronize edilecek en az bir TAC spec dosyası seçin.');
      return;
    }

    setIsSubmitting(true);
    setResultSummary(null);

    try {
      const selectedSpecItems = tacSpecs.filter((s) => tacSelectedSpecs.includes(s.relativePath));
      const itemsToSync: BulkTestCaseItemInput[] = [];

      selectedSpecItems.forEach((spec) => {
        const matched = smartMatchSuite(spec.category ? `${spec.category} / ${spec.name}` : spec.name, projectSuites);
        spec.cases.forEach((scCase) => {
          itemsToSync.push({
            code: scCase.code || undefined,
            title: scCase.title || `${spec.name} Senaryosu`,
            suiteName: matched.suiteName,
            description: `TAC Spec Test Entegrasyonu [${spec.relativePath} - Satır: ${scCase.line}]`,
            executionType: 'AUTOMATED',
            type: spec.relativePath.toLowerCase().includes('desktop') ? 'DESKTOP' : spec.relativePath.toLowerCase().includes('ios') ? 'IOS' : spec.relativePath.toLowerCase().includes('android') ? 'ANDROID' : 'WEB',
            priority: scCase.code?.toLowerCase().includes('smoke') ? 'CRITICAL' : 'NORMAL',
            steps: [
              {
                stepNumber: 1,
                action: `TAC Otomasyonu ile spec çalıştırılır: ${spec.relativePath}`,
                expectedResult: `${scCase.title} doğrulanır ve TAC sonuç raporu oluşturulur`,
              },
            ],
          });
        });
      });

      if (itemsToSync.length === 0) {
        alert('Seçilen spec dosyalarında tanımlı test case bulunamadı.');
        setIsSubmitting(false);
        return;
      }

      const res = await TestCasesService.createBulk(projectId, itemsToSync, updateIfExists);
      setResultSummary({
        success: true,
        total: res.count,
        createdCount: res.createdCount ?? 0,
        updatedCount: res.updatedCount ?? 0,
        message: `${res.count} TAC senaryosu başarıyla TCMS ile senkronize edildi.`,
      });

      await onSuccess();
    } catch (err: any) {
      setResultSummary({
        success: false,
        total: 0,
        createdCount: 0,
        updatedCount: 0,
        message: err?.response?.data?.message || err.message || 'TAC Senkronizasyonu sırasında hata oluştu.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // Cucumber Handlers
  // -------------------------------------------------------------
  const handleCucumberFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    setResultSummary(null);
    const fileNames: string[] = [];
    const allScenarios: ParsedScenarioItem[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        fileNames.push(file.name);
        const text = await file.text();
        const parsed = parseCucumberFeature(text, file.name, existingCases, projectSuites);
        allScenarios.push(...parsed.scenarios);
      }

      setCucumberFileNames(fileNames);
      setCucumberParsed({
        fileName: fileNames.join(', '),
        sourceType: 'CUCUMBER',
        featureTitle: fileNames.length === 1 ? fileNames[0] : `${fileNames.length} Feature Dosyası`,
        scenarios: allScenarios,
        errors: [],
      });
    } catch (err: any) {
      alert(`Dosya okunurken hata: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleParseCucumberText = () => {
    if (!cucumberText.trim()) return;
    setIsProcessing(true);
    setResultSummary(null);
    try {
      const parsed = parseCucumberFeature(cucumberText, 'manual_input.feature', existingCases, projectSuites);
      setCucumberParsed(parsed);
      setCucumberFileNames(['Manuel Metin Girişi']);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadCucumberSample = () => {
    const sample = `@smoke @MOB-402
Feature: Kullanıcı Kimlik Doğrulama ve Giriş Modülü
  Mobil ve web kullanıcılarının sisteme güvenli giriş yapabilmesini sağlar.

  Background:
    Given Uygulama başlatılır ve giriş ekranı görüntülenir

  @MOB-TC-01 @smoke
  Scenario: Başarılı kullanıcı girişi (Geçerli kimlik bilgileri ile)
    When Kullanıcı adı alanına "test_user@banka.com" yazılır
    And Şifre alanına geçerli parola girilir
    And "Giriş Yap" butonuna tıklanır
    Then Kullanıcı ana paneli ve hesap özeti başarıyla görüntülenmelidir

  @MOB-TC-02 @negative
  Scenario: Hatalı parola ile giriş denemesi
    When Kullanıcı adı alanına "test_user@banka.com" yazılır
    And Şifre alanına "YanlisSifre123" girilir
    And "Giriş Yap" butonuna tıklanır
    Then "Geçersiz kullanıcı adı veya parola" hata uyarısı doğrulanır
`;
    setCucumberText(sample);
  };

  // -------------------------------------------------------------
  // Playwright Handlers
  // -------------------------------------------------------------
  const handlePlaywrightFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    setResultSummary(null);
    const allScenarios: ParsedScenarioItem[] = [];
    const fileNames: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        fileNames.push(file.name);
        const text = await file.text();
        const parsed = parsePlaywrightTest(text, file.name, existingCases, projectSuites);
        allScenarios.push(...parsed.scenarios);
      }

      setPlaywrightFileName(fileNames.join(', '));
      setPlaywrightParsed({
        fileName: fileNames.join(', '),
        sourceType: 'PLAYWRIGHT',
        featureTitle: fileNames.length === 1 ? fileNames[0] : `${fileNames.length} Spec Dosyası`,
        scenarios: allScenarios,
        errors: [],
      });
    } catch (err: any) {
      alert(`Playwright dosyası okunurken hata: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleParsePlaywrightText = () => {
    if (!playwrightText.trim()) return;
    setIsProcessing(true);
    setResultSummary(null);
    try {
      const parsed = parsePlaywrightTest(playwrightText, 'manual_spec.ts', existingCases, projectSuites);
      setPlaywrightParsed(parsed);
      setPlaywrightFileName('Manuel Kod Girişi');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadPlaywrightSample = () => {
    const sample = `import { test, expect } from '@playwright/test';

test.describe('Hesaplar ve Para Transferi Modülü', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  // @TC-101 @smoke
  test('Vadesiz hesap bakiyesinin listelenmesi', async ({ page }) => {
    await test.step('Kullanıcı sisteme giriş yapar', async () => {
      await page.fill('#username', 'demo_musteri');
      await page.fill('#password', 'Pass123!');
      await page.click('#btn-submit');
    });

    await test.step('Hesaplar menüsüne tıklanır', async () => {
      await page.click('nav >> text=Hesaplarım');
    });

    await test.step('Vadesiz TL hesabının bakiye bilgisi doğrulanır', async () => {
      await expect(page.locator('.account-balance')).toBeVisible();
    });
  });

  // @TC-102 @transfer
  test('Kayıtlı IBAN alıcısına FAST para transferi', async ({ page }) => {
    await test.step('Para transferi menüsüne gidilir', async () => {
      await page.click('#menu-transfer');
    });

    await test.step('Tutar olarak 500 TL girilir ve onaylanır', async () => {
      await page.fill('#transfer-amount', '500');
      await page.click('#btn-confirm-transfer');
    });

    await test.step('İşlem onay dekontu ekranda görüntülenir', async () => {
      await expect(page.locator('.transfer-success-badge')).toContainText('İşlem Başarılı');
    });
  });
});
`;
    setPlaywrightText(sample);
  };

  // -------------------------------------------------------------
  // Excel Handlers
  // -------------------------------------------------------------
  const handleExcelFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExcelFile(file);
    setIsProcessing(true);
    setResultSummary(null);

    try {
      const res = await parseTestCasesExcel(file);
      const smartMappedCases = res.validCases.map((c) => {
        const matched = smartMatchSuite(c.suiteName || c.title, projectSuites);
        return {
          ...c,
          suiteName: matched.suiteName,
        };
      });
      setExcelParsedCases(smartMappedCases);
      setExcelErrors(res.errors);
    } catch (err: any) {
      alert(`Excel ayrıştırma hatası: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // -------------------------------------------------------------
  // Bulk Commit Handler for Parsed Scenarios
  // -------------------------------------------------------------
  const handleCommitParsedScenarios = async (
    scenarios: ParsedScenarioItem[],
    sourceName: string
  ) => {
    const selected = scenarios.filter((s) => s.isSelected);
    if (selected.length === 0) {
      alert('Lütfen içe aktarmak / güncellemek için en az bir senaryo seçin.');
      return;
    }

    setIsSubmitting(true);
    setResultSummary(null);

    try {
      const itemsToCommit: BulkTestCaseItemInput[] = selected.map((s) => ({
        code: s.code || undefined,
        title: s.title,
        description: s.description,
        suiteName: s.suiteName,
        executionType: s.executionType,
        type: s.type,
        priority: s.priority,
        precondition: s.precondition,
        jiraStoryKey: s.jiraStoryKey,
        steps: s.steps.map((st) => ({
          stepNumber: st.stepNumber,
          action: st.action,
          expectedResult: st.expectedResult,
        })),
      }));

      const res = await TestCasesService.createBulk(projectId, itemsToCommit, updateIfExists);

      setResultSummary({
        success: true,
        total: res.count,
        createdCount: res.createdCount ?? 0,
        updatedCount: res.updatedCount ?? 0,
        message: `${sourceName} senaryoları başarıyla işlendi: ${res.createdCount ?? 0} yeni eklendi, ${res.updatedCount ?? 0} var olan güncellendi.`,
      });

      await onSuccess();
    } catch (err: any) {
      setResultSummary({
        success: false,
        total: 0,
        createdCount: 0,
        updatedCount: 0,
        message: err?.response?.data?.message || err.message || 'İçe aktarma sırasında bir hata oluştu.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCommitExcelCases = async () => {
    if (excelParsedCases.length === 0) return;

    setIsSubmitting(true);
    setResultSummary(null);

    try {
      const res = await TestCasesService.createBulk(projectId, excelParsedCases, updateIfExists);

      setResultSummary({
        success: true,
        total: res.count,
        createdCount: res.createdCount ?? 0,
        updatedCount: res.updatedCount ?? 0,
        message: `Excel senaryoları başarıyla işlendi: ${res.createdCount ?? 0} yeni eklendi, ${res.updatedCount ?? 0} güncellendi.`,
      });

      await onSuccess();
    } catch (err: any) {
      setResultSummary({
        success: false,
        total: 0,
        createdCount: 0,
        updatedCount: 0,
        message: err?.response?.data?.message || err.message || 'Excel aktarımı başarısız oldu.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper toggle scenario selection in preview
  const toggleScenarioSelection = (
    scenarios: ParsedScenarioItem[],
    setScenariosState: React.Dispatch<React.SetStateAction<any>>,
    id: string
  ) => {
    setScenariosState((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        scenarios: prev.scenarios.map((s: ParsedScenarioItem) =>
          s.id === id ? { ...s, isSelected: !s.isSelected } : s
        ),
      };
    });
  };

  const toggleSelectAllScenarios = (
    select: boolean,
    setScenariosState: React.Dispatch<React.SetStateAction<any>>
  ) => {
    setScenariosState((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        scenarios: prev.scenarios.map((s: ParsedScenarioItem) => ({
          ...s,
          isSelected: select,
        })),
      };
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-white dark:bg-[#151a24] border border-slate-200 dark:border-[#2e3748] rounded-2xl shadow-2xl overflow-hidden">
        {/* 1. Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-[#2e3748] bg-slate-50 dark:bg-[#1a212f]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-accent-gradient flex items-center justify-center text-white shadow-md shadow-[var(--accent-dark)]/20">
              <FileCode2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Test Senaryoları İçe Aktar & Güncelle
                </h2>
                <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold rounded-full bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30">
                  {projectName}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Cucumber (.feature), Playwright (.spec.ts), TAC canlı senkronizasyonu veya Excel ile test senaryolarını ekleyin ve güncelleyin.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Navigation Tabs */}
        <div className="flex items-center justify-between px-6 border-b border-slate-200 dark:border-[#2e3748] bg-white dark:bg-[#151a24]">
          <div className="flex space-x-2 sm:space-x-4 overflow-x-auto py-2.5">
            <button
              onClick={() => setActiveTab('CUCUMBER')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'CUCUMBER'
                  ? 'bg-accent-gradient text-white shadow-sm shadow-[var(--accent-dark)]/30'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <span className="text-sm">🥒</span>
              <span>Cucumber (.feature)</span>
            </button>

            <button
              onClick={() => setActiveTab('PLAYWRIGHT')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'PLAYWRIGHT'
                  ? 'bg-accent-gradient text-white shadow-sm shadow-[var(--accent-dark)]/30'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <span className="text-sm">🎭</span>
              <span>Playwright (.spec.ts)</span>
            </button>

            <button
              onClick={() => setActiveTab('TAC')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'TAC'
                  ? 'bg-accent-gradient text-white shadow-sm shadow-[var(--accent-dark)]/30'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <span className="text-sm">⚡</span>
              <span>TAC Servisi (Canlı)</span>
              {tacOnline !== null && (
                <span
                  className={`w-2 h-2 rounded-full ${
                    tacOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                  }`}
                  title={tacOnline ? 'TAC Port 8000 Aktif' : 'TAC Kapalı'}
                />
              )}
            </button>

            <button
              onClick={() => setActiveTab('EXCEL')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'EXCEL'
                  ? 'bg-accent-gradient text-white shadow-sm shadow-[var(--accent-dark)]/30'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              <span>Excel / CSV</span>
            </button>
          </div>

          {/* Update Mode Toggle */}
          <div className="flex items-center space-x-2 shrink-0 pl-2">
            <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={updateIfExists}
                onChange={(e) => setUpdateIfExists(e.target.checked)}
                className="w-4 h-4 rounded text-[var(--accent-primary)] focus:ring-[var(--accent-primary)] border-slate-300 dark:border-slate-700 dark:bg-slate-800 cursor-pointer"
              />
              <span className="hidden sm:inline">Var Olanları Güncelle</span>
            </label>
            <div
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-help"
              title="Açık olduğunda: Kod (@MOB-TC-01) veya başlık eşleşen mevcut senaryolar yeni adımlarla güncellenir. Kapalı olduğunda: Sadece yeni senaryolar eklenir."
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* 3. Result Banner */}
        {resultSummary && (
          <div
            className={`mx-6 mt-4 p-3.5 rounded-xl border flex items-center justify-between text-xs animate-fadeIn ${
              resultSummary.success
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
            }`}
          >
            <div className="flex items-center space-x-2">
              {resultSummary.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span className="font-semibold">{resultSummary.message}</span>
            </div>
            <button
              onClick={() => setResultSummary(null)}
              className="p-1 hover:bg-emerald-500/20 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* 4. Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: CUCUMBER */}
          {activeTab === 'CUCUMBER' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* File Upload Zone */}
                <div
                  onClick={() => cucumberFileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 dark:border-[#2e3748] hover:border-[var(--accent-primary)] dark:hover:border-[var(--accent-primary)] rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-slate-50/50 dark:bg-[#1a212f]/40 hover:bg-slate-50 dark:hover:bg-[#1a212f]"
                >
                  <input
                    ref={cucumberFileInputRef}
                    type="file"
                    multiple
                    accept=".feature"
                    onChange={handleCucumberFilesSelected}
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Cucumber .feature Dosyalarını Yükleyin
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                    Tek veya çoklu dosya seçebilir veya sürükleyip bırakabilirsiniz. Türkçe & İngilizce Gherkin tam uyumludur.
                  </p>
                  {cucumberFileNames.length > 0 && (
                    <div className="mt-3 inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-500 text-[11px] font-mono font-bold">
                      <Check className="w-3 h-3" />
                      <span>{cucumberFileNames.length} Dosya Seçildi</span>
                    </div>
                  )}
                </div>

                {/* Direct Text Paste Area */}
                <div className="space-y-2 flex flex-col">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                      <span>Gherkin Metnini Doğrudan Yapıştırın</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleLoadCucumberSample}
                      className="text-[11px] font-semibold text-[var(--accent-primary)] hover:underline flex items-center space-x-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Örnek Şablon Yükle</span>
                    </button>
                  </div>
                  <textarea
                    rows={6}
                    value={cucumberText}
                    onChange={(e) => setCucumberText(e.target.value)}
                    placeholder={`@smoke\nFeature: Giriş Modülü\n  Scenario: Başarılı Giriş\n    When Kullanıcı adı girilir\n    Then Giriş onaylanır`}
                    className="w-full flex-1 bg-white dark:bg-[#111620] border border-slate-200 dark:border-[#2e3748] rounded-xl p-3 text-xs font-mono text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)] resize-none"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleParseCucumberText}
                      disabled={!cucumberText.trim() || isProcessing}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      Metni Ayrıştır (Parse)
                    </button>
                  </div>
                </div>
              </div>

              {/* Parsed Scenarios Preview Table */}
              {cucumberParsed && cucumberParsed.scenarios.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-[#2e3748]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                        Ayrıştırılan Senaryolar ({cucumberParsed.scenarios.length})
                      </h3>
                      <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[10px]">
                        <button
                          onClick={() => setPreviewFilter('ALL')}
                          className={`px-2 py-0.5 rounded ${previewFilter === 'ALL' ? 'bg-white dark:bg-slate-700 font-bold text-slate-800 dark:text-slate-100' : 'text-slate-500'}`}
                        >
                          Tümü ({cucumberParsed.scenarios.length})
                        </button>
                        <button
                          onClick={() => setPreviewFilter('NEW')}
                          className={`px-2 py-0.5 rounded ${previewFilter === 'NEW' ? 'bg-white dark:bg-slate-700 font-bold text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}
                        >
                          Yeni ({cucumberParsed.scenarios.filter((s) => s.matchStatus === 'NEW').length})
                        </button>
                        <button
                          onClick={() => setPreviewFilter('UPDATE')}
                          className={`px-2 py-0.5 rounded ${previewFilter === 'UPDATE' ? 'bg-white dark:bg-slate-700 font-bold text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}
                        >
                          Güncelleme ({cucumberParsed.scenarios.filter((s) => s.matchStatus === 'UPDATE').length})
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => toggleSelectAllScenarios(true, setCucumberParsed)}
                        className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
                      >
                        Tümünü Seç
                      </button>
                      <span className="text-slate-300 dark:text-slate-700">|</span>
                      <button
                        type="button"
                        onClick={() => toggleSelectAllScenarios(false, setCucumberParsed)}
                        className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
                      >
                        Temizle
                      </button>
                    </div>
                  </div>

                  <div className="border border-slate-200 dark:border-[#2e3748] rounded-xl overflow-hidden bg-white dark:bg-[#1a212f]/40">
                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-[#2e3748]">
                      {cucumberParsed.scenarios
                        .filter((s) => previewFilter === 'ALL' || s.matchStatus === previewFilter)
                        .map((sc) => (
                          <div
                            key={sc.id}
                            className={`p-3 flex items-start space-x-3 transition-colors ${
                              sc.isSelected
                                ? 'bg-slate-50/70 dark:bg-[#1a212f]'
                                : 'opacity-60 bg-white dark:bg-[#151a24]'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={sc.isSelected}
                              onChange={() =>
                                toggleScenarioSelection(
                                  cucumberParsed.scenarios,
                                  setCucumberParsed,
                                  sc.id
                                )
                              }
                              className="w-4 h-4 mt-1 rounded text-[var(--accent-primary)] focus:ring-[var(--accent-primary)] border-slate-300 dark:border-slate-700 dark:bg-slate-800 cursor-pointer"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center flex-wrap gap-2">
                                <span
                                  className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-md ${
                                    sc.matchStatus === 'UPDATE'
                                      ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                                      : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                  }`}
                                >
                                  {sc.matchStatus === 'UPDATE'
                                    ? `GÜNCELLEME (${sc.matchedCaseCode || sc.code})`
                                    : 'YENİ'}
                                </span>

                                {sc.code && (
                                  <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                                    {sc.code}
                                  </span>
                                )}

                                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                  {sc.title}
                                </span>

                                {sc.jiraStoryKey && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 font-mono font-bold">
                                    Jira: {sc.jiraStoryKey}
                                  </span>
                                )}
                              </div>

                              <div className="mt-1 flex items-center space-x-3 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap gap-y-1">
                                <div className="flex items-center space-x-1.5">
                                  <span className="text-slate-400">Modül:</span>
                                  {projectSuites.length > 0 ? (
                                    <select
                                      value={sc.suiteName || ''}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setCucumberParsed((prev) =>
                                          prev
                                            ? {
                                                ...prev,
                                                scenarios: prev.scenarios.map((item) =>
                                                  item.id === sc.id ? { ...item, suiteName: val, isAutoMatched: false } : item
                                                ),
                                              }
                                            : null
                                        );
                                      }}
                                      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-md px-2 py-0.5 text-[11px] font-semibold focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer"
                                    >
                                      {sc.originalRawSuiteName && !projectSuites.some((s) => s.name === sc.originalRawSuiteName) && (
                                        <option value={sc.originalRawSuiteName}>📁 {sc.originalRawSuiteName} (Yeni Modül)</option>
                                      )}
                                      {projectSuites.map((s) => (
                                        <option key={s.id} value={s.name}>
                                          ✓ {s.name}
                                        </option>
                                      ))}
                                    </select>
                                  ) : (
                                    <strong>{sc.suiteName}</strong>
                                  )}
                                  {sc.isAutoMatched && (
                                    <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                      ✨ Akıllı Eşleşti
                                    </span>
                                  )}
                                </div>
                                <span>•</span>
                                <span>{sc.steps.length} Adım</span>
                                {sc.tags.length > 0 && (
                                  <>
                                    <span>•</span>
                                    <span className="text-slate-400 dark:text-slate-500 truncate">
                                      {sc.tags.join(' ')}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleCommitParsedScenarios(
                          cucumberParsed.scenarios,
                          'Cucumber'
                        )
                      }
                      disabled={isSubmitting}
                      className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-accent-gradient hover:brightness-110 shadow-md shadow-[var(--accent-dark)]/30 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      <span>
                        Seçili {cucumberParsed.scenarios.filter((s) => s.isSelected).length} Senaryoyu TCMS'e Aktar & Güncelle
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PLAYWRIGHT */}
          {activeTab === 'PLAYWRIGHT' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* File Upload Zone */}
                <div
                  onClick={() => playwrightFileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 dark:border-[#2e3748] hover:border-[var(--accent-primary)] dark:hover:border-[var(--accent-primary)] rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-slate-50/50 dark:bg-[#1a212f]/40 hover:bg-slate-50 dark:hover:bg-[#1a212f]"
                >
                  <input
                    ref={playwrightFileInputRef}
                    type="file"
                    multiple
                    accept=".ts,.js,.tsx,.jsx"
                    onChange={handlePlaywrightFilesSelected}
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3">
                    <Terminal className="w-6 h-6" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Playwright Test Dosyalarını Yükleyin (.spec.ts / .test.ts)
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                    `test.describe`, `test(...)`, `test.step(...)` ve assertion blokları otomatik ayrıştırılarak test senaryolarına dönüştürülür.
                  </p>
                  {playwrightFileName && (
                    <div className="mt-3 inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-purple-500/15 text-purple-500 text-[11px] font-mono font-bold">
                      <Check className="w-3 h-3" />
                      <span>{playwrightFileName}</span>
                    </div>
                  )}
                </div>

                {/* Direct Text Paste Area */}
                <div className="space-y-2 flex flex-col">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                      <span>Playwright Kodunu Doğrudan Yapıştırın</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleLoadPlaywrightSample}
                      className="text-[11px] font-semibold text-[var(--accent-primary)] hover:underline flex items-center space-x-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Örnek Playwright Kodu Yükle</span>
                    </button>
                  </div>
                  <textarea
                    rows={6}
                    value={playwrightText}
                    onChange={(e) => setPlaywrightText(e.target.value)}
                    placeholder={`import { test, expect } from '@playwright/test';\ntest.describe('Modül', () => {\n  test('Senaryo', async ({ page }) => {\n    await page.goto('/');\n  });\n});`}
                    className="w-full flex-1 bg-white dark:bg-[#111620] border border-slate-200 dark:border-[#2e3748] rounded-xl p-3 text-xs font-mono text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)] resize-none"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleParsePlaywrightText}
                      disabled={!playwrightText.trim() || isProcessing}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      Kodu Ayrıştır (Parse)
                    </button>
                  </div>
                </div>
              </div>

              {/* Parsed Playwright Scenarios Preview Table */}
              {playwrightParsed && playwrightParsed.scenarios.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-[#2e3748]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                        Ayrıştırılan Playwright Senaryoları ({playwrightParsed.scenarios.length})
                      </h3>
                      <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[10px]">
                        <button
                          onClick={() => setPreviewFilter('ALL')}
                          className={`px-2 py-0.5 rounded ${previewFilter === 'ALL' ? 'bg-white dark:bg-slate-700 font-bold text-slate-800 dark:text-slate-100' : 'text-slate-500'}`}
                        >
                          Tümü ({playwrightParsed.scenarios.length})
                        </button>
                        <button
                          onClick={() => setPreviewFilter('NEW')}
                          className={`px-2 py-0.5 rounded ${previewFilter === 'NEW' ? 'bg-white dark:bg-slate-700 font-bold text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}
                        >
                          Yeni ({playwrightParsed.scenarios.filter((s) => s.matchStatus === 'NEW').length})
                        </button>
                        <button
                          onClick={() => setPreviewFilter('UPDATE')}
                          className={`px-2 py-0.5 rounded ${previewFilter === 'UPDATE' ? 'bg-white dark:bg-slate-700 font-bold text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}
                        >
                          Güncelleme ({playwrightParsed.scenarios.filter((s) => s.matchStatus === 'UPDATE').length})
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => toggleSelectAllScenarios(true, setPlaywrightParsed)}
                        className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
                      >
                        Tümünü Seç
                      </button>
                      <span className="text-slate-300 dark:text-slate-700">|</span>
                      <button
                        type="button"
                        onClick={() => toggleSelectAllScenarios(false, setPlaywrightParsed)}
                        className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
                      >
                        Temizle
                      </button>
                    </div>
                  </div>

                  <div className="border border-slate-200 dark:border-[#2e3748] rounded-xl overflow-hidden bg-white dark:bg-[#1a212f]/40">
                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-[#2e3748]">
                      {playwrightParsed.scenarios
                        .filter((s) => previewFilter === 'ALL' || s.matchStatus === previewFilter)
                        .map((sc) => (
                          <div
                            key={sc.id}
                            className={`p-3 flex items-start space-x-3 transition-colors ${
                              sc.isSelected
                                ? 'bg-slate-50/70 dark:bg-[#1a212f]'
                                : 'opacity-60 bg-white dark:bg-[#151a24]'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={sc.isSelected}
                              onChange={() =>
                                toggleScenarioSelection(
                                  playwrightParsed.scenarios,
                                  setPlaywrightParsed,
                                  sc.id
                                )
                              }
                              className="w-4 h-4 mt-1 rounded text-[var(--accent-primary)] focus:ring-[var(--accent-primary)] border-slate-300 dark:border-slate-700 dark:bg-slate-800 cursor-pointer"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center flex-wrap gap-2">
                                <span
                                  className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-md ${
                                    sc.matchStatus === 'UPDATE'
                                      ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                                      : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                  }`}
                                >
                                  {sc.matchStatus === 'UPDATE'
                                    ? `GÜNCELLEME (${sc.matchedCaseCode || sc.code})`
                                    : 'YENİ'}
                                </span>

                                {sc.code && (
                                  <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                                    {sc.code}
                                  </span>
                                )}

                                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                  {sc.title}
                                </span>
                              </div>

                              <div className="mt-1 flex items-center space-x-3 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap gap-y-1">
                                <div className="flex items-center space-x-1.5">
                                  <span className="text-slate-400">Modül:</span>
                                  {projectSuites.length > 0 ? (
                                    <select
                                      value={sc.suiteName || ''}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setPlaywrightParsed((prev) =>
                                          prev
                                            ? {
                                                ...prev,
                                                scenarios: prev.scenarios.map((item) =>
                                                  item.id === sc.id ? { ...item, suiteName: val, isAutoMatched: false } : item
                                                ),
                                              }
                                            : null
                                        );
                                      }}
                                      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-md px-2 py-0.5 text-[11px] font-semibold focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer"
                                    >
                                      {sc.originalRawSuiteName && !projectSuites.some((s) => s.name === sc.originalRawSuiteName) && (
                                        <option value={sc.originalRawSuiteName}>📁 {sc.originalRawSuiteName} (Yeni Modül)</option>
                                      )}
                                      {projectSuites.map((s) => (
                                        <option key={s.id} value={s.name}>
                                          ✓ {s.name}
                                        </option>
                                      ))}
                                    </select>
                                  ) : (
                                    <strong>{sc.suiteName}</strong>
                                  )}
                                  {sc.isAutoMatched && (
                                    <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                      ✨ Akıllı Eşleşti
                                    </span>
                                  )}
                                </div>
                                <span>•</span>
                                <span>{sc.steps.length} Adım</span>
                                <span>•</span>
                                <span className="text-purple-600 dark:text-purple-400 font-mono font-bold">AUTOMATED</span>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleCommitParsedScenarios(
                          playwrightParsed.scenarios,
                          'Playwright'
                        )
                      }
                      disabled={isSubmitting}
                      className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-accent-gradient hover:brightness-110 shadow-md shadow-[var(--accent-dark)]/30 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      <span>
                        Seçili {playwrightParsed.scenarios.filter((s) => s.isSelected).length} Playwright Senaryosunu Aktar & Güncelle
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TAC (TEST AUTOMATION CENTER) */}
          {activeTab === 'TAC' && (
            <div className="space-y-6">
              {/* TAC Connection & Status Card */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-[#2e3748] bg-slate-50/70 dark:bg-[#1a212f]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      tacOnline
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        Test Automation Center (TAC) Entegrasyonu
                      </h4>
                      <span
                        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          tacOnline
                            ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${tacOnline ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <span>{tacOnline ? 'PORT 8000 ÇEVRİMİÇİ' : 'BAĞLANTI YOK'}</span>
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Adres: <code className="font-mono text-[10px]">http://localhost:8000</code> • Canlı Spec kataloğu, WebDriverIO/Appium koşuları ve senaryo senkronizasyonu
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    type="button"
                    onClick={checkTacHealth}
                    disabled={tacChecking}
                    className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                    title="Bağlantıyı Yeniden Kontrol Et"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${tacChecking ? 'animate-spin' : ''}`} />
                  </button>

                  {onOpenAutomationModal && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenAutomationModal();
                      }}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-accent-gradient hover:brightness-110 shadow-sm cursor-pointer"
                    >
                      <Play className="w-3 h-3" />
                      <span>Canlı Koşum Modalı</span>
                    </button>
                  )}
                </div>
              </div>

              {/* TAC Specs List & Sync Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      TAC Spec Kataloğu ({tacSpecs.length} Dosya)
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      TAC projesindeki tanımlı spec ve case kodlarını TCMS test senaryolarına aktarın veya güncelleyin.
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleSelectAllTacSpecs(true)}
                      className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:underline cursor-pointer"
                    >
                      Tümünü Seç
                    </button>
                    <span className="text-slate-300 dark:text-slate-700">|</span>
                    <button
                      type="button"
                      onClick={() => handleSelectAllTacSpecs(false)}
                      className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:underline cursor-pointer"
                    >
                      Temizle
                    </button>
                  </div>
                </div>

                {tacLoadingSpecs ? (
                  <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[var(--accent-primary)]" />
                    <span>TAC Spec listesi taranıyor...</span>
                  </div>
                ) : tacSpecs.length === 0 ? (
                  <div className="p-6 border border-dashed border-slate-300 dark:border-[#2e3748] rounded-xl text-center text-xs text-slate-500 space-y-2">
                    <AlertCircle className="w-6 h-6 mx-auto text-slate-400" />
                    <p>TAC üzerinde tanımlı spec dosyası bulunamadı veya TAC servisi kapalı.</p>
                    <p className="text-[11px] text-slate-400">TAC sunucusunun port 8000 üzerinde çalıştığından emin olun.</p>
                  </div>
                ) : (
                  <div className="border border-slate-200 dark:border-[#2e3748] rounded-xl overflow-hidden bg-white dark:bg-[#1a212f]/40">
                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-[#2e3748]">
                      {tacSpecs.map((spec) => {
                        const isSelected = tacSelectedSpecs.includes(spec.relativePath);
                        const totalCases = spec.cases?.length || 0;
                        const caseCodes = spec.cases?.map((c) => c.code).filter(Boolean) || [];

                        return (
                          <div
                            key={spec.relativePath}
                            className={`p-3.5 flex items-start space-x-3 transition-colors ${
                              isSelected
                                ? 'bg-slate-50/70 dark:bg-[#1a212f]'
                                : 'opacity-60 bg-white dark:bg-[#151a24]'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleTacSpec(spec.relativePath)}
                              className="w-4 h-4 mt-1 rounded text-[var(--accent-primary)] focus:ring-[var(--accent-primary)] border-slate-300 dark:border-slate-700 dark:bg-slate-800 cursor-pointer"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center flex-wrap gap-2">
                                <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                                  {spec.name}
                                </span>
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/10 text-purple-500 border border-purple-500/20">
                                  {totalCases} Senaryo
                                </span>
                                {spec.category && (
                                  <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                    {spec.category}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] font-mono text-slate-400 mt-0.5 truncate">
                                {spec.relativePath}
                              </p>
                              {caseCodes.length > 0 && (
                                <div className="mt-1.5 flex flex-wrap gap-1">
                                  {caseCodes.map((code) => (
                                    <span
                                      key={code}
                                      className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                                    >
                                      {code}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleSyncTacSpecsToCases}
                    disabled={isSubmitting || tacSelectedSpecs.length === 0}
                    className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-accent-gradient hover:brightness-110 shadow-md shadow-[var(--accent-dark)]/30 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    <span>
                      Seçili TAC Spec'lerini TCMS ile Senkronize Et & Güncelle
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: EXCEL */}
          {activeTab === 'EXCEL' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-[#2e3748] bg-slate-50/70 dark:bg-[#1a212f]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      Excel / CSV Toplu İçe Aktarma & Güncelleme
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Excel şablonundaki kolonlar üzerinden senaryoları toplu olarak oluşturun veya güncelleyin.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={downloadTestCaseTemplate}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors cursor-pointer shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Şablon İndir (.xlsx)</span>
                </button>
              </div>

              {/* Excel Drop Zone */}
              <div
                onClick={() => excelFileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-[#2e3748] hover:border-[var(--accent-primary)] dark:hover:border-[var(--accent-primary)] rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-slate-50/50 dark:bg-[#1a212f]/40 hover:bg-slate-50 dark:hover:bg-[#1a212f]"
              >
                <input
                  ref={excelFileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleExcelFileSelected}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Excel Dosyasını Sürükleyip Bırakın veya Seçin
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                  .xlsx, .xls veya .csv formatında hazırladığınız test senaryoları dosyasını yükleyin.
                </p>
                {excelFile && (
                  <div className="mt-3 inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-500/15 text-blue-500 text-[11px] font-mono font-bold">
                    <Check className="w-3 h-3" />
                    <span>{excelFile.name} ({excelParsedCases.length} Senaryo Hazır)</span>
                  </div>
                )}
              </div>

              {excelErrors.length > 0 && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-600 dark:text-amber-400 text-xs space-y-1">
                  <span className="font-bold">⚠️ Excel dosyasında bazı uyarılara rastlandı:</span>
                  <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
                    {excelErrors.slice(0, 5).map((e, idx) => (
                      <li key={idx}>Satır {e.row}: {e.message}</li>
                    ))}
                  </ul>
                </div>
              )}

              {excelParsedCases.length > 0 && (
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleCommitExcelCases}
                    disabled={isSubmitting}
                    className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-accent-gradient hover:brightness-110 shadow-md shadow-[var(--accent-dark)]/30 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    <span>
                      {excelParsedCases.length} Excel Senaryosunu Aktar & Güncelle
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 5. Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-[#2e3748] bg-slate-50 dark:bg-[#1a212f] flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
            <Info className="w-3.5 h-3.5 shrink-0 text-[var(--accent-primary)]" />
            <span>
              {updateIfExists
                ? 'Var olan senaryolar güncellenecektir (Update Mode Açık).'
                : 'Yalnızca yeni senaryolar eklenecektir.'}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
