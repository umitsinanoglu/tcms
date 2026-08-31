'use client';

import React, { useEffect, useState } from 'react';
import {
  X,
  Play,
  Smartphone,
  Layers,
  Radio,
  Cpu,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Globe,
  Tag,
  Sliders,
  ExternalLink
} from 'lucide-react';
import {
  TACDevice,
  TACSpecItem,
  TACService,
  WebhooksService,
  TriggerAutomationWebhookDto,
  TestRun
} from '@/services/api';

interface AutomationTriggerModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName?: string;
  suites?: { id: string; name: string }[];
  caseCodes?: string[];
  onTriggerSuccess: (testRun: TestRun, platform: string, deviceAlias: string) => void;
}

export const AutomationTriggerModal: React.FC<AutomationTriggerModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName = 'Proje',
  suites = [],
  caseCodes = [],
  onTriggerSuccess,
}) => {
  const [platform, setPlatform] = useState<'iOS' | 'Android'>('iOS');
  const [deviceAlias, setDeviceAlias] = useState<string>('iphone15');
  const [environment, setEnvironment] = useState('UAT');
  const [version, setVersion] = useState('v2.4.0');
  const [title, setTitle] = useState('');
  const [scope, setScope] = useState<'ALL' | 'SUITE' | 'SELECTED_CASES' | 'SPECS'>('ALL');
  const [selectedSuiteId, setSelectedSuiteId] = useState<string>('');
  const [customCaseCodes, setCustomCaseCodes] = useState<string>('');
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([]);
  const [webhookUrl, setWebhookUrl] = useState('http://localhost:8000/api/webhook/trigger');

  // TAC Live Data
  const [devices, setDevices] = useState<TACDevice[]>([]);
  const [specs, setSpecs] = useState<TACSpecItem[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isLoadingSpecs, setIsLoadingSpecs] = useState(false);
  const [tacOnline, setTacOnline] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load initial devices and check TAC status
  useEffect(() => {
    if (!isOpen) return;

    setTitle(`Mobil Otomasyon Koşusu (${platform}) - ${new Date().toLocaleDateString('tr-TR')}`);
    if (caseCodes && caseCodes.length > 0) {
      setCustomCaseCodes(caseCodes.join(', '));
      setScope('SELECTED_CASES');
    }

    checkTacHealth();
    scanDevices();
    fetchSpecs();
  }, [isOpen, platform]);

  const checkTacHealth = async () => {
    try {
      const res = await TACService.checkHealth();
      setTacOnline(res.online);
    } catch {
      setTacOnline(false);
    }
  };

  const scanDevices = async () => {
    setIsScanning(true);
    try {
      const res = await TACService.scanDevices();
      if (res.success && res.data && res.data.length > 0) {
        setDevices(res.data);
        // auto select first matching platform device
        const match = res.data.find((d) => d.platform.toLowerCase() === platform.toLowerCase());
        if (match) {
          setDeviceAlias(match.alias || match.udid);
        }
      } else {
        // fallback predefined devices
        setDevices([
          { udid: '00008120-001A24E22E43A01E', name: 'iPhone 15', platform: 'iOS', state: 'device', isConfigured: true, alias: 'iphone15' },
          { udid: '00008110-00123C923C39A01E', name: 'iPhone 14', platform: 'iOS', state: 'device', isConfigured: true, alias: 'iphone14' },
          { udid: 'R5CX123456', name: 'Samsung S24', platform: 'Android', state: 'device', isConfigured: true, alias: 's24' },
          { udid: 'emulator-5554', name: 'Pixel 8 Pro Android 14', platform: 'Android', state: 'device', isConfigured: true, alias: 'emulator-5554' },
        ]);
      }
    } catch {
      // fallback
    } finally {
      setIsScanning(false);
    }
  };

  const fetchSpecs = async () => {
    setIsLoadingSpecs(true);
    try {
      const res = await TACService.getSpecs();
      if (res.success && res.data) {
        setSpecs(res.data);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingSpecs(false);
    }
  };

  const handleToggleSpec = (specPath: string) => {
    if (selectedSpecs.includes(specPath)) {
      setSelectedSpecs(selectedSpecs.filter((s) => s !== specPath));
    } else {
      setSelectedSpecs([...selectedSpecs, specPath]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const parsedCases = customCaseCodes
        .split(',')
        .map((c) => c.trim())
        .filter((c) => c.length > 0);

      const payload: TriggerAutomationWebhookDto = {
        webhookUrl: webhookUrl.trim(),
        title: title.trim() || `Otomasyon Koşusu - ${platform}`,
        platform,
        deviceAlias,
        environment,
        version,
        scope: scope === 'SPECS' ? 'SPECIFIC' : (scope as any),
        suiteId: scope === 'SUITE' ? selectedSuiteId : undefined,
        caseCodes: scope === 'SELECTED_CASES' ? parsedCases : undefined,
        specs: scope === 'SPECS' ? selectedSpecs : undefined,
        triggeredBy: 'TCMS UI Operator',
      };

      const result = await WebhooksService.triggerAutomation(projectId, payload);

      if (result.success || result.testRun) {
        onTriggerSuccess(result.testRun, platform, deviceAlias);
        onClose();
      } else {
        setErrorMsg(result.message || 'Otomasyon tetiklenirken hata oluştu');
      }
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err.message || 'Bilinmeyen bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const filteredDevices = devices.filter((d) => d.platform.toLowerCase() === platform.toLowerCase());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="flex flex-col w-full max-w-2xl max-h-[90vh] rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Play className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Mobil Test Otomasyonunu Başlat</h3>
              <p className="text-xs text-slate-400">
                Test Automation Center (TAC) üzerinden gerçek cihaz ve emülatörlerde test koşumu
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TAC Connection Status Banner */}
        <div className="flex items-center justify-between px-6 py-2 bg-slate-950/80 border-b border-slate-800/80 text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                tacOnline === true ? 'bg-emerald-400 animate-ping' : tacOnline === false ? 'bg-rose-400' : 'bg-amber-400'
              }`}
            />
            <span className="text-slate-300">
              TAC Servis Durumu:{' '}
              <strong className={tacOnline ? 'text-emerald-400' : 'text-rose-400'}>
                {tacOnline === true ? 'Online (Port 8000)' : tacOnline === false ? 'Offline / Ulaşılamıyor' : 'Kontrol Ediliyor...'}
              </strong>
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              checkTacHealth();
              scanDevices();
            }}
            className="flex items-center gap-1 text-purple-400 hover:text-purple-300 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>Cihazları Tara</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-sm">
          {errorMsg && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Platform Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Hedef Platform</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setPlatform('iOS');
                  setDeviceAlias('iphone15');
                }}
                className={`flex items-center justify-center gap-2.5 py-3 rounded-xl border text-sm font-semibold transition-all ${
                  platform === 'iOS'
                    ? 'bg-purple-600/20 border-purple-500 text-white shadow-lg shadow-purple-900/30'
                    : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                <Smartphone className="w-4 h-4 text-purple-400" />
                <span>iOS (XCUITest / WDA)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPlatform('Android');
                  setDeviceAlias('s24');
                }}
                className={`flex items-center justify-center gap-2.5 py-3 rounded-xl border text-sm font-semibold transition-all ${
                  platform === 'Android'
                    ? 'bg-emerald-600/20 border-emerald-500 text-white shadow-lg shadow-emerald-900/30'
                    : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span>Android (UiAutomator2)</span>
              </button>
            </div>
          </div>

          {/* Device Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">Hedef Cihaz / Emülatör</label>
              <span className="text-[11px] text-slate-400">{filteredDevices.length} cihaz algılandı</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {filteredDevices.length > 0 ? (
                filteredDevices.map((d) => (
                  <button
                    key={d.udid || d.alias}
                    type="button"
                    onClick={() => setDeviceAlias(d.alias || d.udid)}
                    className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                      deviceAlias === (d.alias || d.udid)
                        ? 'bg-slate-800 border-purple-500 text-white shadow-md'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-semibold text-xs text-slate-200">{d.name || d.alias}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                          d.state === 'device' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-700 text-slate-400'
                        }`}
                      >
                        {d.alias}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 mt-1 truncate max-w-[200px]">
                      UDID: {d.udid}
                    </span>
                  </button>
                ))
              ) : (
                <div className="col-span-2 p-3 text-center text-xs text-slate-500 bg-slate-950/30 rounded-xl border border-slate-800">
                  Bağlı cihaz bulunamadı. Lütfen cihazı bağlayıp "Cihazları Tara" butonuna tıklayınız.
                </div>
              )}
            </div>
          </div>

          {/* Test Scope */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Test Kapsamı (Scope)</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'ALL', label: 'Tümü' },
                { id: 'SUITE', label: 'Test Paketi' },
                { id: 'SELECTED_CASES', label: 'Case Kodları' },
                { id: 'SPECS', label: 'Spec Dosyaları' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setScope(item.id as any)}
                  className={`py-2 rounded-lg text-xs font-medium border transition-all ${
                    scope === item.id
                      ? 'bg-purple-600 text-white border-purple-500 font-bold'
                      : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Scope Details */}
            {scope === 'SUITE' && (
              <div className="mt-3">
                <select
                  value={selectedSuiteId}
                  onChange={(e) => setSelectedSuiteId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="">-- Test Paketi Seçin --</option>
                  {suites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {scope === 'SELECTED_CASES' && (
              <div className="mt-3">
                <input
                  type="text"
                  value={customCaseCodes}
                  onChange={(e) => setCustomCaseCodes(e.target.value)}
                  placeholder="Örn: MOB-TC-1, MOB-TC-2, MOB-BENEFICIARY-1"
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">Virgülle ayırarak case kodlarını giriniz.</p>
              </div>
            )}

            {scope === 'SPECS' && (
              <div className="mt-3 space-y-2 max-h-40 overflow-y-auto p-2 bg-slate-950/50 rounded-xl border border-slate-800">
                {specs.length > 0 ? (
                  specs.map((s) => (
                    <label
                      key={s.relativePath}
                      className="flex items-center gap-2 text-xs text-slate-300 hover:text-white cursor-pointer select-none p-1 rounded hover:bg-slate-800/50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSpecs.includes(s.relativePath)}
                        onChange={() => handleToggleSpec(s.relativePath)}
                        className="rounded border-slate-700 text-purple-600 focus:ring-0 bg-slate-800"
                      />
                      <FileCode className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span className="font-mono text-[11px] truncate">{s.name}</span>
                      <span className="text-[10px] text-slate-400 ml-auto">({s.cases.length} case)</span>
                    </label>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 text-center py-2">TAC'tan spec listesi yüklenemedi.</p>
                )}
              </div>
            )}
          </div>

          {/* Environment & Version & Title */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Test Ortamı</label>
              <select
                value={environment}
                onChange={(e) => setEnvironment(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
              >
                <option value="UAT">UAT</option>
                <option value="STAGING">STAGING</option>
                <option value="DEV">DEV</option>
                <option value="PROD">PROD</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Uygulama Versiyonu</label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-purple-500 font-mono"
              />
            </div>
          </div>

          {/* Webhook Endpoint */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">TAC Webhook Alıcı Adresi</label>
            <input
              type="text"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-purple-500"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/80 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
          >
            İptal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-purple-900/40 transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Tetikleniyor...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>⚡ Otomasyonu Başlat & Canlı İzle</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
