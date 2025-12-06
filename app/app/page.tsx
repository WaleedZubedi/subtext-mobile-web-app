'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import * as api from '@/lib/api';

// Demo phases - exact match from Subtext-main
const phases = [
  {
    surfaceText: "Hey, are you free tonight?",
    hiddenText: "I need validation and attention",
    analysis: "Classic availability test → Fishing for priority status",
    manipulationType: "ATTENTION-SEEKING"
  },
  {
    surfaceText: "Just checking in on you 😊",
    hiddenText: "I want to control your time",
    analysis: "Fake concern → Boundary invasion disguised as care",
    manipulationType: "CONTROLLING"
  },
  {
    surfaceText: "We should catch up soon!",
    hiddenText: "I need something from you",
    analysis: "Vague obligation → Creating social debt without commitment",
    manipulationType: "MANIPULATIVE"
  },
  {
    surfaceText: "Miss our conversations...",
    hiddenText: "Guilt-tripping you to respond",
    analysis: "Emotional leverage → Weaponizing nostalgia for response",
    manipulationType: "GUILT-TRIPPING"
  }
];

export default function AppScreen() {
  const { user, hasSubscription, logout, loading } = useAuth();
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [showScanLine, setShowScanLine] = useState(false);
  const [showHiddenIntent, setShowHiddenIntent] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [typewriterText, setTypewriterText] = useState('');

  // Analysis states
  const [inputMethod, setInputMethod] = useState<'upload' | 'manual' | null>(null);
  const [manualText, setManualText] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [error, setError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isAnimatingRef = useRef(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Typewriter effect
  const typeWriter = async (text: string) => {
    setTypewriterText('');
    for (let i = 0; i <= text.length; i++) {
      setTypewriterText(text.substring(0, i));
      await new Promise(resolve => setTimeout(resolve, 40));
    }
  };

  // Demo animation loop
  useEffect(() => {
    let timeouts: NodeJS.Timeout[] = [];
    let isActive = true;

    const runPhaseAnimation = async (phaseIndex: number) => {
      if (!isActive || isAnimatingRef.current) return;
      isAnimatingRef.current = true;

      // Reset all states
      setShowScanLine(false);
      setShowHiddenIntent(false);
      setShowAnalysis(false);
      setTypewriterText('');
      setCurrentPhase(phaseIndex);

      // Wait for message to appear
      await new Promise(resolve => {
        timeouts.push(setTimeout(resolve, 1200));
      });
      if (!isActive) return;

      // Start scan line
      setShowScanLine(true);
      await new Promise(resolve => {
        timeouts.push(setTimeout(resolve, 1400));
      });
      if (!isActive) return;

      // Hide scan line, show hidden intent
      setShowScanLine(false);
      setShowHiddenIntent(true);
      await new Promise(resolve => {
        timeouts.push(setTimeout(resolve, 900));
      });
      if (!isActive) return;

      // Show analysis box
      setShowAnalysis(true);
      await new Promise(resolve => {
        timeouts.push(setTimeout(resolve, 300));
      });
      if (!isActive) return;

      // Type out analysis
      const phase = phases[phaseIndex];
      await typeWriter(phase.analysis);
      if (!isActive) return;

      // Stay visible for 2.5 seconds
      await new Promise(resolve => {
        timeouts.push(setTimeout(resolve, 2500));
      });
      if (!isActive) return;

      isAnimatingRef.current = false;
    };

    const animationLoop = async () => {
      let phaseIndex = 0;

      while (isActive) {
        await runPhaseAnimation(phaseIndex);
        phaseIndex = (phaseIndex + 1) % phases.length;

        // Short pause between phases
        await new Promise(resolve => {
          timeouts.push(setTimeout(resolve, 800));
        });
      }
    };

    animationLoop();

    return () => {
      isActive = false;
      isAnimatingRef.current = false;
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, []); // Only run once on mount

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setInputMethod('upload');
    }
  };

  const handleManualInput = () => {
    setInputMethod('manual');
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleAnalyze = async () => {
    if (!hasSubscription) {
      router.push('/subscription');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      let textToAnalyze = '';

      if (inputMethod === 'upload' && selectedImage) {
        const ocrResult = await api.uploadImageForOCR(selectedImage);
        textToAnalyze = ocrResult.text;
        setExtractedText(textToAnalyze);
      } else if (inputMethod === 'manual') {
        textToAnalyze = manualText;
      }

      if (!textToAnalyze) {
        setError('No text to analyze');
        setIsProcessing(false);
        return;
      }

      const analysis = await api.analyzeMessages([textToAnalyze]);
      setAnalysisResult(analysis);
    } catch (err: any) {
      setError(err.message || 'Analysis failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setInputMethod(null);
    setManualText('');
    setSelectedImage(null);
    setImagePreview(null);
    setExtractedText('');
    setAnalysisResult(null);
    setError('');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] via-[#2d2d2d] to-[#1a1a1a] flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">😈</div>
          <p className="text-[#FF6B6B] font-bold">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const currentPhaseData = phases[currentPhase];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] via-[#2d2d2d] to-[#1a1a1a]">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-[rgba(26,26,26,0.98)] border-b-2 border-[rgba(255,107,107,0.4)] shadow-xl">
        <div className="container-mobile flex items-center justify-between py-4">
          <div className="flex-1"></div>
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="text-white">Sub</span>
            <span className="text-[#FF6B6B]">Text</span>
          </h1>
          <div className="flex-1 flex justify-end">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-3 hover:opacity-80 transition-opacity"
            >
              <div className="space-y-1.5">
                <div className="w-6 h-0.5 bg-[#FF6B6B] rounded"></div>
                <div className="w-6 h-0.5 bg-[#FF6B6B] rounded"></div>
                <div className="w-6 h-0.5 bg-[#FF6B6B] rounded"></div>
              </div>
            </button>
          </div>
        </div>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-[rgba(255,107,107,0.2)] bg-[rgba(26,26,26,0.98)]"
            >
              <div className="container-mobile py-3 space-y-2">
                <button onClick={() => router.push('/settings')} className="flex items-center w-full text-left px-4 py-3 text-white bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,107,107,0.1)] rounded-xl transition-colors border border-transparent hover:border-[rgba(255,107,107,0.2)]">
                  <div className="w-11 h-11 rounded-full bg-[rgba(255,107,107,0.12)] border border-[rgba(255,107,107,0.2)] flex items-center justify-center mr-4">
                    <span className="text-xl">⚙️</span>
                  </div>
                  <span className="font-semibold">Settings</span>
                </button>
                <button onClick={() => router.push('/subscription')} className="flex items-center w-full text-left px-4 py-3 text-white bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,107,107,0.1)] rounded-xl transition-colors border border-transparent hover:border-[rgba(255,107,107,0.2)]">
                  <div className="w-11 h-11 rounded-full bg-[rgba(255,107,107,0.12)] border border-[rgba(255,107,107,0.2)] flex items-center justify-center mr-4">
                    <span className="text-xl">💎</span>
                  </div>
                  <span className="font-semibold">Subscription</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <div className="container-mobile py-8 px-5">
        {/* Demo Animation Section */}
        {!analysisResult && !isProcessing && (
          <div className="py-10 px-5 min-h-[400px] flex flex-col items-center justify-center">
            {/* Message Bubble */}
            <div className="bg-[#2d2d2d] rounded-[20px] p-4.5 max-w-[85%] shadow-[0_4px_8px_rgba(0,0,0,0.3)] border border-[#404040] mb-4 relative overflow-hidden">
              <p className="text-white text-base font-medium leading-[22px]">
                {currentPhaseData.surfaceText}
              </p>

              {/* Scan Line */}
              {showScanLine && (
                <motion.div
                  className="absolute top-0 bottom-0 w-0.5 bg-[#FF6B6B]"
                  style={{
                    boxShadow: '0 0 8px rgba(255, 107, 107, 0.8)',
                  }}
                  initial={{ left: '-30px' }}
                  animate={{ left: 'calc(100% + 30px)' }}
                  transition={{ duration: 1.2, ease: 'linear' }}
                />
              )}
            </div>

            {/* Hidden Intent Bubble */}
            {showHiddenIntent && (
              <motion.div
                initial={{ opacity: 0, y: -30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.9 }}
                className="bg-[#1a1a1a] rounded-[18px] p-4 max-w-[85%] shadow-[0_4px_12px_rgba(255,107,107,0.4)] border-2 border-[#FF6B6B] mb-4 relative"
              >
                {/* Arrow pointing up */}
                <div className="absolute -top-2.5 left-1/2 -ml-2.5 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[10px] border-b-[#FF6B6B]"></div>

                <p className="text-[#FF6B6B] text-[15px] font-semibold leading-5 italic text-center">
                  {currentPhaseData.hiddenText}
                </p>
              </motion.div>
            )}

            {/* Analysis Layer */}
            {showAnalysis && (
              <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="bg-[#0a0a0a] rounded-2xl p-4 w-[90%] shadow-[0_8px_16px_rgba(0,0,0,0.5)] border border-[#333]"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-full bg-[#FF6B6B] flex items-center justify-center shadow-[0_0_6px_rgba(255,107,107,0.6)]">
                    <span className="text-white text-[11px] font-bold">AI</span>
                  </div>
                  <span className="text-white text-sm font-bold flex-1">SubText Analysis</span>
                  <div className="bg-[rgba(255,0,0,0.2)] px-2 py-1 rounded-md border border-[rgba(255,0,0,0.3)]">
                    <span className="text-[#ff4444] text-[9px] font-semibold">{currentPhaseData.manipulationType}</span>
                  </div>
                </div>
                <p className="text-[#ccc] text-sm leading-5 font-medium">
                  {typewriterText}
                  {typewriterText.length < currentPhaseData.analysis.length && (
                    <span className="text-[#FF6B6B] font-bold animate-pulse ml-0.5">|</span>
                  )}
                </p>
              </motion.div>
            )}

            {/* Training Stats */}
            <div className="mt-8 text-center">
              <div className="flex items-center justify-center gap-2">
                <span className="text-xl">⚡</span>
                <p className="text-[#888] text-sm font-medium">
                  Trained on <span className="text-[#FF6B6B] font-bold">50,000+</span> conversations
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Processing */}
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-12 text-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="text-6xl mb-4"
            >
              😈
            </motion.div>
            <p className="text-white text-lg font-bold">Analyzing...</p>
            <p className="text-[#888] text-sm mt-2">Decoding hidden intentions</p>
          </motion.div>
        )}

        {/* Analysis Result */}
        {analysisResult && (
          <div className="space-y-4">
            {/* Hidden Intent Card */}
            <div className="bg-[#0f0f0f] rounded-2xl border border-[#333] shadow-[0_6px_12px_rgba(0,0,0,0.4)] overflow-hidden">
              <div className="flex items-center px-4 py-3.5 bg-[rgba(255,255,255,0.05)] border-b border-[rgba(255,255,255,0.1)]">
                <div className="w-10 h-10 rounded-full mr-3 flex items-center justify-center">
                  <div className="w-8 h-5 rounded-2xl border-2 border-[#FF6B6B] relative">
                    <div className="w-2 h-2 rounded-full bg-[#FF6B6B] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white text-lg font-bold">Hidden Intent</span>
                    <div className="bg-[rgba(255,0,0,0.2)] px-2 py-1 rounded-md border border-[rgba(255,0,0,0.3)]">
                      <span className="text-[#ff4444] text-[11px] font-semibold">MANIPULATION</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-3/5">
                    <div className="h-0.5 flex-1 bg-[rgba(255,255,255,0.1)] rounded overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#FF6B6B] to-[#ff4444] w-[96%]"></div>
                    </div>
                    <span className="text-[#FF6B6B] text-[10px] font-semibold min-w-[30px]">96%</span>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <p className="text-white text-[15px] leading-[22px] font-medium">{analysisResult.hiddenIntent}</p>
              </div>
            </div>

            {/* Strategic Reply Card */}
            <div className="bg-[#0f0f0f] rounded-2xl border border-[#333] shadow-[0_6px_12px_rgba(0,0,0,0.4)] overflow-hidden">
              <div className="flex items-center px-4 py-3.5 bg-[rgba(255,255,255,0.05)] border-b border-[rgba(255,255,255,0.1)]">
                <div className="w-10 h-10 mr-3 flex items-center justify-center relative">
                  <div className="w-8 h-9 bg-[#333] rounded-2xl rounded-bl-lg rounded-br-lg"></div>
                  <div className="w-6 h-7 bg-[#FFD700] rounded-xl rounded-bl-md rounded-br-md absolute"></div>
                  <div className="w-2 h-2 bg-[#333] rounded-full absolute"></div>
                </div>
                <div className="flex-1">
                  <span className="text-white text-lg font-bold">Strategic Reply</span>
                  <p className="text-[#888] text-xs font-medium">Protect yourself</p>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <p className="text-white text-[15px] leading-[22px] font-medium mb-1">{analysisResult.strategicReply}</p>
                <button
                  onClick={() => copyToClipboard(analysisResult.strategicReply)}
                  className="bg-[rgba(255,107,107,0.2)] px-3 py-2 rounded-lg border border-[rgba(255,107,107,0.3)] inline-block"
                >
                  <span className="text-[#FF6B6B] text-xs font-semibold">Copy</span>
                </button>
              </div>
            </div>

            {/* New Analysis Button */}
            <div className="pt-4">
              <button
                onClick={handleReset}
                className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,107,107,0.3)] rounded-2xl shadow-[0_4px_8px_rgba(255,107,107,0.2)] hover:bg-[rgba(255,107,107,0.1)] transition-colors"
              >
                <div className="flex items-center justify-center py-3.5 px-5 gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-[rgba(255,107,107,0.3)] flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#FF6B6B]"></div>
                  </div>
                  <span className="text-white text-base font-semibold">New Analysis</span>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Input Methods */}
        {!analysisResult && !isProcessing && (
          <div className="space-y-4 mt-6">
            {/* Upload Button */}
            <button
              onClick={handleUploadClick}
              className="w-full rounded-2xl overflow-hidden shadow-[0_6px_12px_rgba(255,107,107,0.3)]"
            >
              <div className="bg-gradient-to-r from-[#FF6B6B] to-[#ff8888] flex items-center justify-center py-4 px-6 gap-3">
                <svg className="w-6 h-5" viewBox="0 0 24 20" fill="none">
                  <rect x="0" y="4" width="24" height="16" rx="4" fill="rgba(255,255,255,0.9)" />
                  <circle cx="12" cy="12" r="6" stroke="rgba(255,255,255,0.9)" strokeWidth="2" fill="rgba(255,255,255,0.3)" />
                  <rect x="4" y="0" width="4" height="4" rx="2" fill="rgba(255,255,255,0.9)" />
                </svg>
                <span className="text-white text-lg font-bold">Upload Screenshot</span>
              </div>
            </button>

            {/* Manual Input Button */}
            <button
              onClick={handleManualInput}
              className="w-full flex items-center justify-center bg-transparent py-3.5 px-5 rounded-xl border border-[rgba(255,255,255,0.3)] hover:border-[#FF6B6B] transition-colors"
            >
              <span className="text-white text-base font-semibold">✍️ Type Manually</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Image Preview */}
            {imagePreview && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl overflow-hidden shadow-[0_6px_12px_rgba(0,0,0,0.3)]"
              >
                <img src={imagePreview} alt="Preview" className="w-full" />
              </motion.div>
            )}

            {/* Manual Text Input */}
            {inputMethod === 'manual' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <textarea
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  placeholder="Paste or type the conversation here..."
                  className="w-full h-40 bg-[rgba(255,255,255,0.1)] text-white rounded-xl p-4 border border-[rgba(255,255,255,0.2)] focus:border-[#FF6B6B] focus:outline-none resize-none"
                />
              </motion.div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-[rgba(255,0,0,0.1)] border border-[rgba(255,0,0,0.3)] rounded-xl p-4 text-center">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Analyze Button */}
            {(selectedImage || manualText) && (
              <button
                onClick={handleAnalyze}
                className="w-full rounded-xl overflow-hidden shadow-[0_4px_8px_rgba(255,107,107,0.3)]"
              >
                <div className="bg-gradient-to-r from-[#FF6B6B] to-[#ff8888] py-3.5 px-5 text-center">
                  <span className="text-white text-base font-bold">Analyze Conversation</span>
                </div>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
