import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  UploadCloud,
  Download,
  AlertCircle,
  CheckCircle2,
  X,
  FileText,
  Loader2,
  Layers,
  ArrowRight,
  RefreshCw,
  Info,
} from 'lucide-react';
import {
  TestCasesService,
  TestPlansService,
  BulkTestCaseItemInput,
  BulkTestPlanItemInput,
} from '@/services/api';
import {
  downloadTestCaseTemplate,
  downloadTestPlanTemplate,
  parseTestCasesExcel,
  parseTestPlansExcel,
} from '@/utils/excelUtils';

export type ImportType = 'TEST_CASES' | 'TEST_PLANS';

interface ExcelImportModalProps {
  isOpen: boolean;
  type: ImportType;
  projectId: string;
  projectName?: string;
  onClose: () => void;
  onSuccess: () => Promise<void> | void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  type,
  projectId,
  projectName,
  onClose,
  onSuccess,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [activeTab, setActiveTab] = useState<'VALID' | 'ERRORS'>('VALID');

  // Parsed data state
  const [validCases, setValidCases] = useState<BulkTestCaseItemInput[]>([]);
  const [validPlans, setValidPlans] = useState<BulkTestPlanItemInput[]>([]);
  const [errors, setErrors] = useState<{ row: number; message: string; details?: string }[]>([]);
  const [totalRows, setTotalRows] = useState<number>(0);
  const [importResult, setImportResult] = useState<{ success: boolean; count: number; message?: string } | null>(null);

  if (!isOpen) return null;

  const isCaseImport = type === 'TEST_CASES';
  const modalTitle = isCaseImport ? 'Excel ile Test Senaryoları İçe Aktar' : 'Excel ile Test Planları İçe Aktar';
  const validCount = isCaseImport ? validCases.length : validPlans.length;

  const handleDownloadTemplate = () => {
    if (isCaseImport) {
      downloadTestCaseTemplate();
    } else {
      downloadTestPlanTemplate();
    }
  };

  const handleFileProcess = async (file: File) => {
    if (!file) return;
    setSelectedFile(file);
    setIsParsing(true);
    setErrors([]);
    setImportResult(null);

    try {
      if (isCaseImport) {
        const result = await parseTestCasesExcel(file);
        setValidCases(result.validCases);
        setErrors(result.errors);
        setTotalRows(result.totalRows);
        setActiveTab(result.validCases.length > 0 ? 'VALID' : 'ERRORS');
      } else {
        const result = await parseTestPlansExcel(file);
        setValidPlans(result.validPlans);
        setErrors(result.errors);
        setTotalRows(result.totalRows);
        setActiveTab(result.validPlans.length > 0 ? 'VALID' : 'ERRORS');
      }
    } catch (err: any) {
      setErrors([{ row: 0, message: err?.message || 'Dosya işlenirken bilinmeyen bir hata oluştu' }]);
      setActiveTab('ERRORS');
    } finally {
      setIsParsing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileProcess(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setValidCases([]);
    setValidPlans([]);
    setErrors([]);
    setTotalRows(0);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExecuteImport = async () => {
    if (validCount === 0 || !projectId) return;

    setIsImporting(true);
    try {
      if (isCaseImport) {
        const res = await TestCasesService.createBulk(projectId, validCases, true);
        setImportResult({
          success: true,
          count: res.count || validCases.length,
          message: `${res.count || validCases.length} adet test senaryosu ve adımları başarıyla içe aktarıldı!`,
        });
      } else {
        const res = await TestPlansService.createBulk(projectId, validPlans);
        setImportResult({
          success: true,
          count: res.count || validPlans.length,
          message: `${res.count || validPlans.length} adet test planı başarıyla oluşturuldu!`,
        });
      }

      await onSuccess();
      setTimeout(() => {
        onClose();
        handleReset();
      }, 1400);
    } catch (err: any) {
      setImportResult({
        success: false,
        count: 0,
        message: `İçe aktarma başarısız oldu: ${err?.response?.data?.message || err?.message || 'Bilinmeyen hata'}`,
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#161f30] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-[#121926]/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                {modalTitle}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {projectName ? `${projectName} projesine` : 'Seçili projeye'} toplu veri aktarımı yapın.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all shadow-xs cursor-pointer"
              title="Şablon Dosyasını İndir"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Şablon İndir (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          
          {/* Step 1: Upload or Drop Area */}
          {!selectedFile ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
                isDragging
                  ? 'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10 scale-[0.99]'
                  : 'border-slate-200 dark:border-slate-700 hover:border-emerald-500/60 hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileInputChange}
                className="hidden"
              />

              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3.5 shadow-xs">
                <UploadCloud className="w-7 h-7" />
              </div>

              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Excel veya CSV dosyanızı buraya sürükleyin
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                veya bilgisayarınızdan seçmek için tıklayın (.xlsx, .xls, .csv desteklenir)
              </p>

              <div className="mt-5 flex items-center gap-2 text-[11px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>Hazır şablon formatına uygun doldurulmuş dosyaları doğrudan yükleyebilirsiniz.</span>
              </div>
            </div>
          ) : (
            /* Step 2: File Selected & Validation Summary */
            <div className="space-y-4">
              
              {/* File Info Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-50 dark:bg-[#121926] rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block truncate max-w-xs sm:max-w-md">
                      {selectedFile.name}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {(selectedFile.size / 1024).toFixed(1)} KB • Toplam {totalRows} satır işlendi
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Farklı Dosya Seç</span>
                  </button>
                </div>
              </div>

              {/* Parsing State */}
              {isParsing ? (
                <div className="py-12 text-center text-slate-400">
                  <Loader2 className="w-7 h-7 mx-auto mb-2 animate-spin text-emerald-500" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Excel dosyası taranıyor ve doğrulanıyor...
                  </p>
                </div>
              ) : (
                <>
                  {/* KPI Badges */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 flex items-center space-x-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <div>
                        <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 block tracking-wider">
                          Geçerli Kayıt
                        </span>
                        <span className="text-base font-black text-emerald-800 dark:text-emerald-300 leading-none">
                          {validCount} {isCaseImport ? 'Senaryo' : 'Plan'}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/20 flex items-center space-x-3">
                      <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                      <div>
                        <span className="text-[10px] uppercase font-bold text-rose-700 dark:text-rose-400 block tracking-wider">
                          Hata / Uyarı
                        </span>
                        <span className="text-base font-black text-rose-800 dark:text-rose-300 leading-none">
                          {errors.length} Satır
                        </span>
                      </div>
                    </div>

                    <div className="col-span-2 sm:col-span-1 p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center space-x-3">
                      <Layers className="w-5 h-5 text-slate-600 dark:text-slate-400 shrink-0" />
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block tracking-wider">
                          İşlem Durumu
                        </span>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-none">
                          {validCount > 0 ? 'Aktarıma Hazır' : 'Kayıt Bulunamadı'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tabs: Valid vs Errors */}
                  <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setActiveTab('VALID')}
                      className={`pb-2.5 flex items-center space-x-1.5 transition-colors cursor-pointer ${
                        activeTab === 'VALID'
                          ? 'border-b-2 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                      }`}
                    >
                      <span>Aktarılacak Veriler</span>
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                        {validCount}
                      </span>
                    </button>

                    {errors.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setActiveTab('ERRORS')}
                        className={`pb-2.5 flex items-center space-x-1.5 transition-colors cursor-pointer ${
                          activeTab === 'ERRORS'
                            ? 'border-b-2 border-rose-500 text-rose-600 dark:text-rose-400'
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                        }`}
                      >
                        <span>Hatalar & Uyarılar</span>
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                          {errors.length}
                        </span>
                      </button>
                    )}
                  </div>

                  {/* Tab Content: Preview Table */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                    {activeTab === 'VALID' ? (
                      validCount === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-400">
                          Aktarılacak geçerli kayıt bulunamadı. Lütfen şablon kurallarına uygun doldurunuz.
                        </div>
                      ) : isCaseImport ? (
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-slate-50 dark:bg-[#121926] sticky top-0 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-600 dark:text-slate-300">
                            <tr>
                              <th className="p-2.5 pl-4">MODÜL</th>
                              <th className="p-2.5">BAŞLIK</th>
                              <th className="p-2.5">ÖNCELİK</th>
                              <th className="p-2.5">TİP</th>
                              <th className="p-2.5 pr-4 text-right">ADIM SAYISI</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                            {validCases.map((tc, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                <td className="p-2.5 pl-4 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                                  {tc.suiteName || 'Genel'}
                                </td>
                                <td className="p-2.5 font-semibold text-slate-800 dark:text-slate-200 max-w-xs truncate">
                                  {tc.title}
                                </td>
                                <td className="p-2.5">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                    {tc.priority}
                                  </span>
                                </td>
                                <td className="p-2.5 text-slate-500 font-mono text-[11px]">
                                  {tc.type}
                                </td>
                                <td className="p-2.5 pr-4 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                                  {tc.steps?.length || 0} Adım
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-slate-50 dark:bg-[#121926] sticky top-0 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-600 dark:text-slate-300">
                            <tr>
                              <th className="p-2.5 pl-4">PLAN BAŞLIĞI</th>
                              <th className="p-2.5">SÜRÜM</th>
                              <th className="p-2.5">ORTAM</th>
                              <th className="p-2.5 pr-4">DURUM</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                            {validPlans.map((tp, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                <td className="p-2.5 pl-4 font-semibold text-slate-800 dark:text-slate-200 max-w-xs truncate">
                                  {tp.title}
                                </td>
                                <td className="p-2.5 font-mono text-[11px] text-slate-500">
                                  {tp.version}
                                </td>
                                <td className="p-2.5 font-mono text-[11px] text-slate-500">
                                  {tp.environment}
                                </td>
                                <td className="p-2.5 pr-4">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                    {tp.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )
                    ) : (
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-rose-50/60 dark:bg-rose-950/30 sticky top-0 border-b border-rose-200 dark:border-rose-900/40 font-bold text-rose-800 dark:text-rose-300">
                          <tr>
                            <th className="p-2.5 pl-4 w-20">SATIR</th>
                            <th className="p-2.5">HATA MESAJI</th>
                            <th className="p-2.5 pr-4">DETAY</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
                          {errors.map((err, idx) => (
                            <tr key={idx} className="hover:bg-rose-50/20 dark:hover:bg-rose-900/10">
                              <td className="p-2.5 pl-4 font-mono font-bold text-rose-600 dark:text-rose-400">
                                {err.row > 0 ? `#${err.row}` : '-'}
                              </td>
                              <td className="p-2.5 font-medium text-rose-700 dark:text-rose-300">
                                {err.message}
                              </td>
                              <td className="p-2.5 pr-4 text-slate-400 text-[11px] truncate max-w-xs">
                                {err.details || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </>
              )}

              {/* Execution Feedback Notification */}
              {importResult && (
                <div
                  className={`p-3.5 rounded-xl flex items-center space-x-2.5 text-xs font-semibold ${
                    importResult.success
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20'
                  }`}
                >
                  {importResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{importResult.message}</span>
                </div>
              )}

            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-[#121926]/50">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {selectedFile && !isParsing && (
              <span>
                {validCount} adet kayıt sisteme aktarılmaya hazır.
              </span>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isImporting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              İptal
            </button>

            <button
              type="button"
              disabled={!selectedFile || isParsing || validCount === 0 || isImporting}
              onClick={handleExecuteImport}
              className="inline-flex items-center space-x-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 transition-all shadow-sm shadow-emerald-600/20 active:scale-98 cursor-pointer"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>İçe Aktarılıyor...</span>
                </>
              ) : (
                <>
                  <span>{validCount} Kaydı İçe Aktar</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
