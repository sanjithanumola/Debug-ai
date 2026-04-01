import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { 
  Play, 
  Bug, 
  CheckCircle2, 
  Zap, 
  BookOpen, 
  Copy, 
  Check, 
  RotateCcw,
  Code2,
  Terminal,
  AlertCircle,
  Loader2
} from 'lucide-react';
import Markdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DebugResult {
  errors: string[];
  fixes: string[];
  optimizedCode: string;
  explanation: string;
}

const LANGUAGES = [
  { id: 'javascript', name: 'JavaScript', icon: 'JS' },
  { id: 'python', name: 'Python', icon: 'PY' },
  { id: 'cpp', name: 'C++', icon: 'C++' },
  { id: 'java', name: 'Java', icon: 'JV' },
];

export default function App() {
  const [code, setCode] = useState<string>('// Paste your code here to debug\nlet a = 5\nconsole.log(b)');
  const [language, setLanguage] = useState('javascript');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<DebugResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleDebug = async () => {
    if (!code.trim()) return;
    
    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze code');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const openKeySelector = async () => {
    const aiStudio = (window as any).aistudio;
    if (aiStudio?.openSelectKey) {
      await aiStudio.openSelectKey();
    } else {
      alert("API Key selection is only available in the AI Studio environment.");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setCode('');
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0f1117] text-slate-200">
      {/* Header */}
      <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-[#0f1117]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Bug className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">DebugAI</h1>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Professional Code Analysis</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={openKeySelector}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-indigo-400 transition-colors"
            title="Configure API Key"
          >
            <Zap className="w-5 h-5" />
          </button>

          <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.id}
                onClick={() => setLanguage(lang.id)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200",
                  language === lang.id 
                    ? "bg-indigo-600 text-white shadow-md" 
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                )}
              >
                {lang.name}
              </button>
            ))}
          </div>
          
          <button
            onClick={handleDebug}
            disabled={isAnalyzing || !code.trim()}
            className={cn(
              "flex items-center gap-2 px-5 py-2 rounded-lg font-bold text-sm transition-all duration-200",
              isAnalyzing || !code.trim()
                ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 active:scale-95"
            )}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                Debug Code
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Side: Editor */}
        <div className="w-1/2 flex flex-col border-r border-slate-800">
          <div className="h-10 border-b border-slate-800 flex items-center justify-between px-4 bg-slate-900/50">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
              <Code2 className="w-4 h-4" />
              Source Code
            </div>
            <button 
              onClick={reset}
              className="p-1.5 hover:bg-slate-800 rounded-md text-slate-500 hover:text-slate-300 transition-colors"
              title="Reset Editor"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 relative">
            <Editor
              height="100%"
              language={language}
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value || '')}
              options={{
                fontSize: 14,
                fontFamily: "'JetBrains Mono', monospace",
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                padding: { top: 20 },
                lineNumbers: 'on',
                roundedSelection: true,
                automaticLayout: true,
              }}
            />
          </div>
        </div>

        {/* Right Side: Results */}
        <div className="w-1/2 flex flex-col bg-[#0f1117]">
          <div className="h-10 border-b border-slate-800 flex items-center px-4 bg-slate-900/50">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
              <Terminal className="w-4 h-4" />
              Analysis Results
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            {!result && !isAnalyzing && !error && (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center">
                  <Zap className="w-8 h-8 text-slate-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Ready to Analyze</h3>
                  <p className="text-sm text-slate-400 max-w-xs">
                    Paste your code on the left and click "Debug Code" to start the AI analysis.
                  </p>
                </div>
              </div>
            )}

            {isAnalyzing && (
              <div className="h-full flex flex-col items-center justify-center space-y-6">
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                  <Bug className="w-8 h-8 text-indigo-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-bold text-white">Debugging in Progress</h3>
                  <p className="text-sm text-slate-400">Our AI is scanning your code for errors and optimizations...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 flex gap-4 items-start">
                <AlertCircle className="w-6 h-6 text-red-500 shrink-0" />
                <div>
                  <h3 className="font-bold text-red-500 mb-1">Analysis Failed</h3>
                  <p className="text-sm text-red-200/70">{error}</p>
                  <button 
                    onClick={handleDebug}
                    className="mt-4 text-xs font-bold text-red-500 hover:underline"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}

            {result && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Errors Section */}
                <section className="space-y-3">
                  <div className="flex items-center gap-2 text-red-400 font-bold text-sm uppercase tracking-wider">
                    <AlertCircle className="w-4 h-4" />
                    Detected Errors
                  </div>
                  <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4 space-y-2">
                    {result.errors.length > 0 ? (
                      result.errors.map((err, i) => (
                        <div key={i} className="flex gap-3 text-sm text-red-200/80">
                          <span className="text-red-500 font-bold">•</span>
                          {err}
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-slate-400 italic">No syntax errors detected.</div>
                    )}
                  </div>
                </section>

                {/* Fixes Section */}
                <section className="space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4" />
                    Recommended Fixes
                  </div>
                  <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4 space-y-2">
                    {result.fixes.map((fix, i) => (
                      <div key={i} className="flex gap-3 text-sm text-emerald-200/80">
                        <span className="text-emerald-500 font-bold">•</span>
                        {fix}
                      </div>
                    ))}
                  </div>
                </section>

                {/* Optimized Code Section */}
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm uppercase tracking-wider">
                      <Zap className="w-4 h-4" />
                      Optimized Version
                    </div>
                    <button
                      onClick={() => copyToClipboard(result.optimizedCode)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      {copied ? 'Copied!' : 'Copy Code'}
                    </button>
                  </div>
                  <div className="rounded-xl overflow-hidden border border-slate-800 bg-[#1a1d27]">
                    <Editor
                      height="300px"
                      language={language}
                      theme="vs-dark"
                      value={result.optimizedCode}
                      options={{
                        readOnly: true,
                        fontSize: 13,
                        fontFamily: "'JetBrains Mono', monospace",
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        padding: { top: 15, bottom: 15 },
                        lineNumbers: 'on',
                        automaticLayout: true,
                        domReadOnly: true,
                      }}
                    />
                  </div>
                </section>

                {/* Explanation Section */}
                <section className="space-y-3 pb-8">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-sm uppercase tracking-wider">
                    <BookOpen className="w-4 h-4" />
                    Detailed Explanation
                  </div>
                  <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-6">
                    <div className="markdown-body">
                      <Markdown>{result.explanation}</Markdown>
                    </div>
                  </div>
                </section>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-8 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between px-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
        <div className="flex gap-6">
          <span>Status: <span className="text-emerald-500">System Online</span></span>
          <span>Engine: <span className="text-indigo-400">Gemini 3.1 Pro</span></span>
        </div>
        <div>
          &copy; 2026 AI Debugger Tool
        </div>
      </footer>
    </div>
  );
}
