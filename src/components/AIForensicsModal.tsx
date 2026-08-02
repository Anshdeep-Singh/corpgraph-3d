'use client';

import { useState, useEffect } from 'react';
import { AIConfig, AIProvider, ForensicsReport } from '@/types/graph';
import {
  getAIConfigFromStorage,
  saveAIConfigToStorage,
  runMultiAgent10StepForensics,
} from '@/lib/aiForensics';
import {
  X,
  Key,
  Brain,
  Sparkles,
  Loader2,
  CheckCircle2,
  Eye,
  EyeOff,
  ShieldAlert,
  Bot,
  Activity,
} from 'lucide-react';

interface AIForensicsModalProps {
  isOpen: boolean;
  onClose: () => void;
  graphData: any;
  onReportGenerated: (report: ForensicsReport) => void;
}

export default function AIForensicsModal({
  isOpen,
  onClose,
  graphData,
  onReportGenerated,
}: AIForensicsModalProps) {
  const [config, setConfig] = useState<AIConfig>({
    apiKey: '',
    provider: 'openai',
    model: 'gpt-4o-mini',
    autoAnalyze: false,
  });
  const [showKey, setShowKey] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Multi-Agent Step Progress UI state
  const [stepProgress, setStepProgress] = useState({
    stepNumber: 0,
    agentName: '',
    statusText: '',
    percent: 0,
  });

  useEffect(() => {
    if (isOpen) {
      setConfig(getAIConfigFromStorage());
      setErrorMsg(null);
      setSavedSuccess(false);
      setStepProgress({ stepNumber: 0, agentName: '', statusText: '', percent: 0 });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveConfig = () => {
    saveAIConfigToStorage(config);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleRunAnalysis = async () => {
    if (!graphData) {
      setErrorMsg('No active graph data loaded to audit.');
      return;
    }

    setAnalyzing(true);
    setErrorMsg(null);
    saveAIConfigToStorage(config);

    try {
      const report = await runMultiAgent10StepForensics(
        graphData,
        config,
        (stepNum, agentName, statusText, percent) => {
          setStepProgress({
            stepNumber: stepNum,
            agentName,
            statusText,
            percent,
          });
        }
      );
      onReportGenerated(report);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to complete 10-Step Multi-Agent Forensic Audit');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 overflow-hidden text-slate-100">
        {/* Glow Header */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-indigo-400">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white flex items-center space-x-2">
                <span>10-Agent Forensic Engine</span>
                <span className="text-[10px] px-2 py-0.5 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-semibold rounded-full uppercase">
                  Multi-Agent
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Multi-agent pipeline auditing round-tripping, shell layering & bubble patterns
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <div className="py-5 space-y-4 text-xs">
          {/* Provider Select */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              AI Model Provider
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['openai', 'anthropic', 'gemini', 'openrouter'] as AIProvider[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    const defaultModel =
                      p === 'openai'
                        ? 'gpt-4o-mini'
                        : p === 'anthropic'
                        ? 'claude-3-5-sonnet-20241022'
                        : p === 'gemini'
                        ? 'gemini-1.5-flash'
                        : 'openrouter/auto';
                    setConfig({ ...config, provider: p, model: defaultModel });
                  }}
                  className={`py-2 px-3 rounded-xl border font-semibold text-xs capitalize transition-all ${
                    config.provider === p
                      ? 'bg-indigo-600 border-indigo-400 text-white shadow-md shadow-indigo-500/20'
                      : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Model Identifier */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Model Identifier
            </label>
            <input
              type="text"
              value={config.model}
              onChange={(e) => setConfig({ ...config, model: e.target.value })}
              placeholder="e.g. gpt-4o-mini, claude-3-5-sonnet, gemini-1.5-flash"
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            />
          </div>

          {/* API Key Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Key className="w-3.5 h-3.5 text-indigo-400" />
                <span>{config.provider.toUpperCase()} API Key</span>
              </label>
              <span className="text-[10px] text-slate-500 font-normal">
                Stored in browser <code className="text-indigo-300">localStorage</code>
              </span>
            </div>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={config.apiKey}
                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                placeholder={
                  config.provider === 'openai'
                    ? 'sk-proj-...'
                    : config.provider === 'anthropic'
                    ? 'sk-ant-...'
                    : config.provider === 'gemini'
                    ? 'AIzaSy...'
                    : 'sk-or-...'
                }
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 pr-10 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Multi-Agent Progress Bar when Analyzing */}
          {analyzing ? (
            <div className="p-4 bg-slate-800/80 border border-indigo-500/50 rounded-2xl space-y-2.5 animate-pulse">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-indigo-300 flex items-center space-x-1.5">
                  <Activity className="w-4 h-4 text-indigo-400 animate-spin" />
                  <span>Agent Step {stepProgress.stepNumber}/10: {stepProgress.agentName}</span>
                </span>
                <span className="font-mono text-indigo-400 font-bold">{stepProgress.percent}%</span>
              </div>
              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 transition-all duration-300"
                  style={{ width: `${stepProgress.percent}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400 font-mono">{stepProgress.statusText}</p>
            </div>
          ) : (
            <div className="p-3 bg-slate-800/50 border border-slate-700/60 rounded-2xl text-[11px] text-slate-300 flex items-start space-x-2.5">
              <Bot className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                {config.apiKey.trim() ? (
                  <p>
                    <strong className="text-emerald-400">Multi-Agent LLM Enabled:</strong> 10 specialized agents will execute sequentially with direct LLM calls.
                  </p>
                ) : (
                  <p>
                    <strong className="text-amber-400">Local Multi-Agent Fallback:</strong> No API key set. 10 specialized agent heuristics will execute locally in browser.
                  </p>
                )}
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-xs flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {savedSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>API settings saved to localStorage!</span>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center space-x-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={handleSaveConfig}
            className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 active:bg-slate-800 border border-slate-700 rounded-xl text-slate-200 font-semibold text-xs transition-all"
          >
            Save Settings
          </button>
          <button
            type="button"
            onClick={handleRunAnalysis}
            disabled={analyzing}
            className="flex-1 py-2.5 px-4 bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 active:from-indigo-700 active:to-purple-700 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-500/25 flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Running Pipeline...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Run 10-Agent Audit</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
