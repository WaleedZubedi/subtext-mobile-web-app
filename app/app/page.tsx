'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import * as api from '@/lib/api';

// Demo conversation examples
const demoExamples = [
  {
    message: "Hey, I was just thinking about you...",
    intent: "Testing if you'll respond to vague emotional bait",
    behavior: "ATTENTION SEEKING"
  },
  {
    message: "You're the only one who really gets me",
    intent: "Creating false intimacy to make you feel special",
    behavior: "LOVE BOMBING"
  },
  {
    message: "I guess I'll just figure it out myself then",
    intent: "Guilt-tripping you into offering help",
    behavior: "PASSIVE AGGRESSIVE"
  },
  {
    message: "No worries if you're busy, I understand...",
    intent: "Fake understanding that pressures you to respond",
    behavior: "COVERT MANIPULATION"
  }
];

export default function AppScreen() {
  const { user, hasSubscription, loading } = useAuth();
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);

  // Demo animation states
  const [currentExample, setCurrentExample] = useState(0);
  const [animationPhase, setAnimationPhase] = useState<'typing' | 'scanning' | 'revealing' | 'complete'>('typing');
  const [displayedMessage, setDisplayedMessage] = useState('');
  const [scanProgress, setScanProgress] = useState(0);

  // Analysis states
  const [inputMethod, setInputMethod] = useState<'upload' | 'manual' | null>(null);
  const [manualText, setManualText] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageScanProgress, setImageScanProgress] = useState(0);
  const [extractedText, setExtractedText] = useState('');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Smooth demo animation loop - SLOWER
  useEffect(() => {
    if (analysisResult || isProcessing || imagePreview) return;

    let isMounted = true;
    const example = demoExamples[currentExample];

    const runAnimation = async () => {
      // Phase 1: Type out message - SLOWER (60ms per char)
      setAnimationPhase('typing');
      setDisplayedMessage('');
      setScanProgress(0);

      for (let i = 0; i <= example.message.length; i++) {
        if (!isMounted) return;
        setDisplayedMessage(example.message.slice(0, i));
        await new Promise(r => setTimeout(r, 60)); // Slower typing
      }

      await new Promise(r => setTimeout(r, 800)); // Longer pause
      if (!isMounted) return;

      // Phase 2: Scan animation - SLOWER
      setAnimationPhase('scanning');
      for (let i = 0; i <= 100; i += 1) {
        if (!isMounted) return;
        setScanProgress(i);
        await new Promise(r => setTimeout(r, 25)); // Slower scan
      }

      await new Promise(r => setTimeout(r, 400));
      if (!isMounted) return;

      // Phase 3: Reveal intent
      setAnimationPhase('revealing');
      await new Promise(r => setTimeout(r, 500));
      if (!isMounted) return;

      // Phase 4: Show complete - longer display
      setAnimationPhase('complete');
      await new Promise(r => setTimeout(r, 4000)); // Show longer
      if (!isMounted) return;

      // Move to next example
      setCurrentExample((prev) => (prev + 1) % demoExamples.length);
    };

    runAnimation();

    return () => {
      isMounted = false;
    };
  }, [currentExample, analysisResult, isProcessing, imagePreview]);

  // Image scan animation during processing
  useEffect(() => {
    if (!isProcessing) {
      setImageScanProgress(0);
      return;
    }

    let isMounted = true;
    const animate = async () => {
      while (isMounted && isProcessing) {
        for (let i = 0; i <= 100; i += 1) {
          if (!isMounted) return;
          setImageScanProgress(i);
          await new Promise(r => setTimeout(r, 30));
        }
        await new Promise(r => setTimeout(r, 200));
        setImageScanProgress(0);
      }
    };
    animate();

    return () => { isMounted = false; };
  }, [isProcessing]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Auto-analyze when image is selected
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setInputMethod('upload');
      setError('');

      // Auto-start analysis
      if (!hasSubscription) {
        router.push('/subscription');
        return;
      }

      setIsProcessing(true);

      try {
        const ocrResult = await api.uploadImageForOCR(file);
        let textToAnalyze = '';

        if (ocrResult.ParsedResults && ocrResult.ParsedResults[0]?.ParsedText) {
          textToAnalyze = ocrResult.ParsedResults[0].ParsedText;
        } else if (ocrResult.text) {
          textToAnalyze = ocrResult.text;
        }

        setExtractedText(textToAnalyze);

        if (!textToAnalyze || textToAnalyze.trim().length === 0) {
          setError('No text found in image. Try a clearer screenshot.');
          setIsProcessing(false);
          return;
        }

        const analysis = await api.analyzeMessages([textToAnalyze]);
        setAnalysisResult(analysis);
      } catch (err: any) {
        console.error('Analysis error:', err);
        setError(err.message || 'Analysis failed');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleManualInput = () => {
    setInputMethod('manual');
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleManualAnalyze = async () => {
    if (!hasSubscription) {
      router.push('/subscription');
      return;
    }

    if (!manualText.trim()) {
      setError('Please enter some text to analyze');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const analysis = await api.analyzeMessages([manualText]);
      setAnalysisResult(analysis);
    } catch (err: any) {
      console.error('Analysis error:', err);
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
    setCopied(false);
    setImageScanProgress(0);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-center"
        >
          <div className="text-5xl mb-4">👁️</div>
          <p className="text-[#FF6B6B] font-medium">Loading...</p>
        </motion.div>
      </div>
    );
  }

  if (!user) return null;

  const currentDemo = demoExamples[currentExample];

  return (
    <div className="min-h-screen bg-[#0a0a0a] relative overflow-hidden">
      {/* Background Artifacts */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute top-20 -left-20 w-64 h-64 bg-[#FF6B6B]/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-32 w-80 h-80 bg-[#FF6B6B]/3 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-1/4 w-48 h-48 bg-[#FF6B6B]/4 rounded-full blur-3xl" />

        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `linear-gradient(#FF6B6B 1px, transparent 1px), linear-gradient(90deg, #FF6B6B 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />

        {/* Floating particles */}
        <motion.div
          animate={{ y: [-20, 20, -20], x: [-10, 10, -10] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 left-1/4 w-2 h-2 bg-[#FF6B6B]/20 rounded-full"
        />
        <motion.div
          animate={{ y: [20, -20, 20], x: [10, -10, 10] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-2/3 right-1/4 w-1.5 h-1.5 bg-[#FF6B6B]/15 rounded-full"
        />
        <motion.div
          animate={{ y: [-15, 15, -15] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/2 left-1/3 w-1 h-1 bg-[#FF6B6B]/25 rounded-full"
        />
        <motion.div
          animate={{ y: [10, -10, 10], x: [-5, 5, -5] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-1/3 right-1/3 w-2.5 h-2.5 bg-[#FF6B6B]/10 rounded-full"
        />

        {/* Diagonal lines */}
        <div className="absolute top-0 right-0 w-px h-40 bg-gradient-to-b from-[#FF6B6B]/10 to-transparent rotate-45 origin-top" />
        <div className="absolute bottom-0 left-20 w-px h-32 bg-gradient-to-t from-[#FF6B6B]/10 to-transparent -rotate-45 origin-bottom" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-[#1a1a1a]">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="w-10" />
          <h1 className="text-2xl font-bold">
            <span className="text-white">Sub</span>
            <span className="text-[#FF6B6B]">Text</span>
          </h1>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#1a1a1a] transition-colors"
          >
            <div className="space-y-1">
              <div className="w-4 h-0.5 bg-white/70 rounded" />
              <div className="w-4 h-0.5 bg-white/70 rounded" />
              <div className="w-4 h-0.5 bg-white/70 rounded" />
            </div>
          </button>
        </div>

        {/* Menu Dropdown */}
        <AnimatePresence>
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-[#1a1a1a] p-4 space-y-2"
            >
              <button
                onClick={() => { router.push('/settings'); setShowMenu(false); }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[#1a1a1a] transition-colors"
              >
                <span className="text-lg">⚙️</span>
                <span className="text-white font-medium">Settings</span>
              </button>
              <button
                onClick={() => { router.push('/subscription'); setShowMenu(false); }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[#1a1a1a] transition-colors"
              >
                <span className="text-lg">💎</span>
                <span className="text-white font-medium">Subscription</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="relative z-10 px-5 py-6">
        {/* Demo Animation - Fixed height container */}
        {!analysisResult && !isProcessing && !imagePreview && (
          <div className="mb-8">
            {/* Fixed height demo container to prevent layout shift */}
            <div className="min-h-[280px] relative">
              {/* Message bubble */}
              <div className="bg-[#1a1a1a] rounded-2xl p-5 border border-[#252525] relative overflow-hidden">
                {/* Scan overlay */}
                {animationPhase === 'scanning' && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-[#FF6B6B]/20 to-transparent"
                    style={{ left: `${scanProgress - 100}%`, width: '100%' }}
                  />
                )}

                {/* Scan line */}
                {animationPhase === 'scanning' && (
                  <div
                    className="absolute top-0 bottom-0 w-[2px] bg-[#FF6B6B] shadow-[0_0_10px_#FF6B6B,0_0_20px_#FF6B6B]"
                    style={{ left: `${scanProgress}%` }}
                  />
                )}

                {/* Fixed height text container */}
                <div className="min-h-[56px]">
                  <p className="text-white text-lg font-medium leading-7">
                    "{displayedMessage}"
                    {animationPhase === 'typing' && (
                      <motion.span
                        animate={{ opacity: [1, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                        className="text-[#FF6B6B] ml-0.5"
                      >
                        |
                      </motion.span>
                    )}
                  </p>
                </div>

                {/* Scanning indicator */}
                {animationPhase === 'scanning' && (
                  <div className="mt-4 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#FF6B6B] animate-pulse" />
                    <span className="text-[#FF6B6B] text-sm font-medium">Scanning for manipulation...</span>
                  </div>
                )}
              </div>

              {/* Hidden Intent Reveal - Fixed position */}
              <div className="mt-3 min-h-[120px]">
                <AnimatePresence>
                  {(animationPhase === 'revealing' || animationPhase === 'complete') && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                      className="bg-gradient-to-br from-[#1a0a0a] to-[#0a0a0a] rounded-2xl p-5 border border-[#FF6B6B]/30 shadow-[0_0_30px_rgba(255,107,107,0.15)]"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#FF6B6B]/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-lg">👁️</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="text-white font-bold">Hidden Intent</span>
                            <span className="px-2 py-0.5 bg-[#FF6B6B]/20 text-[#FF6B6B] text-xs font-bold rounded-full border border-[#FF6B6B]/30">
                              {currentDemo.behavior}
                            </span>
                          </div>
                          <p className="text-[#ccc] text-sm leading-relaxed">
                            {currentDemo.intent}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-4 text-center">
              <p className="text-[#666] text-sm">
                Trained on <span className="text-[#FF6B6B] font-bold">50,000+</span> manipulative conversations
              </p>
            </div>
          </div>
        )}

        {/* Image Being Scanned - Shows selected image with scan animation */}
        {isProcessing && imagePreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6"
          >
            <div className="relative rounded-2xl overflow-hidden border border-[#252525]">
              {/* The image */}
              <img
                src={imagePreview}
                alt="Scanning..."
                className="w-full"
              />

              {/* Scan overlay */}
              <div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-[#FF6B6B]/30 to-transparent"
                style={{
                  transform: `translateX(${imageScanProgress - 100}%)`,
                }}
              />

              {/* Scan line */}
              <div
                className="absolute top-0 bottom-0 w-[3px] bg-[#FF6B6B] shadow-[0_0_15px_#FF6B6B,0_0_30px_#FF6B6B,0_0_45px_#FF6B6B]"
                style={{ left: `${imageScanProgress}%` }}
              />

              {/* Scanning badge */}
              <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#FF6B6B] animate-pulse" />
                <span className="text-[#FF6B6B] text-xs font-bold">SCANNING</span>
              </div>
            </div>

            <div className="mt-4 text-center">
              <p className="text-white text-lg font-bold mb-1">Analyzing...</p>
              <p className="text-[#666] text-sm">Exposing their real intentions</p>
            </div>
          </motion.div>
        )}

        {/* Manual input processing state */}
        {isProcessing && !imagePreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-16 text-center"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-6xl mb-6"
            >
              👁️
            </motion.div>
            <p className="text-white text-xl font-bold mb-2">Analyzing...</p>
            <p className="text-[#666] text-sm">Exposing their real intentions</p>

            <div className="mt-6 max-w-xs mx-auto">
              <div className="h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#FF6B6B] to-[#ff8888]"
                  animate={{ width: ['0%', '100%'] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Analysis Results */}
        {analysisResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-5"
          >
            {/* Analyzed Image - Cropped/Small */}
            {imagePreview && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-center"
              >
                <div className="relative w-32 h-32 rounded-xl overflow-hidden border-2 border-[#FF6B6B]/30 shadow-[0_0_20px_rgba(255,107,107,0.2)]">
                  <img
                    src={imagePreview}
                    alt="Analyzed"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-1 left-1 right-1">
                    <div className="bg-green-500/90 rounded-md px-2 py-0.5 text-center">
                      <span className="text-white text-[10px] font-bold">✓ ANALYZED</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Main Analysis Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-[#1a0f0f] to-[#0a0a0a] rounded-3xl border border-[#FF6B6B]/20 overflow-hidden shadow-[0_0_40px_rgba(255,107,107,0.1)]"
            >
              {/* Header */}
              <div className="bg-[#FF6B6B]/10 px-5 py-4 border-b border-[#FF6B6B]/20">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#FF6B6B]/20 flex items-center justify-center">
                      <span className="text-2xl">👁️</span>
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">Hidden Intent</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="h-1.5 w-16 bg-[#FF6B6B]/20 rounded-full overflow-hidden">
                          <div className="h-full w-[95%] bg-gradient-to-r from-[#FF6B6B] to-[#ff4444]" />
                        </div>
                        <span className="text-[#FF6B6B] text-xs font-bold">95%</span>
                      </div>
                    </div>
                  </div>
                  {/* Behavior Pill */}
                  {analysisResult.behaviorType && (
                    <span className="px-3 py-1.5 bg-[#FF6B6B] text-white text-[10px] font-bold rounded-full uppercase tracking-wide whitespace-nowrap">
                      {analysisResult.behaviorType}
                    </span>
                  )}
                </div>
              </div>

              {/* Intent Content */}
              <div className="p-5">
                <p className="text-white text-base leading-relaxed">
                  {analysisResult.hiddenIntent}
                </p>
              </div>
            </motion.div>

            {/* Strategic Reply Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-[#0f0f0f] rounded-3xl border border-[#252525] overflow-hidden"
            >
              {/* Header */}
              <div className="bg-[#1a1a1a] px-5 py-4 border-b border-[#252525]">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FFD700] to-[#FFA500] flex items-center justify-center">
                    <span className="text-2xl">⚡</span>
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">Savage Reply</h3>
                    <p className="text-[#666] text-sm">Call them out</p>
                  </div>
                </div>
              </div>

              {/* Reply Content */}
              <div className="p-5">
                <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-[#252525]">
                  <p className="text-white text-base leading-relaxed italic">
                    "{analysisResult.strategicReply}"
                  </p>
                </div>

                {/* Copy Button */}
                <button
                  onClick={() => copyToClipboard(analysisResult.strategicReply)}
                  className={`mt-4 w-full py-3 rounded-xl font-bold transition-all ${
                    copied
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-[#FF6B6B] text-white hover:bg-[#ff5555]'
                  }`}
                >
                  {copied ? '✓ Copied!' : 'Copy Reply'}
                </button>
              </div>
            </motion.div>

            {/* New Analysis Button */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              onClick={handleReset}
              className="w-full py-4 rounded-2xl border border-[#333] text-white font-bold hover:bg-[#1a1a1a] transition-colors"
            >
              🔄 Analyze Another
            </motion.button>
          </motion.div>
        )}

        {/* Input Section */}
        {!analysisResult && !isProcessing && !imagePreview && (
          <div className="space-y-4">
            {/* Upload Button */}
            <button
              onClick={handleUploadClick}
              className="w-full bg-gradient-to-r from-[#FF6B6B] to-[#ff5555] rounded-2xl py-4 px-6 flex items-center justify-center gap-3 shadow-[0_4px_20px_rgba(255,107,107,0.3)] hover:shadow-[0_4px_30px_rgba(255,107,107,0.4)] transition-all active:scale-[0.98]"
            >
              <span className="text-xl">📸</span>
              <span className="text-white font-bold text-lg">Upload Screenshot</span>
            </button>

            {/* Manual Input Button */}
            <button
              onClick={handleManualInput}
              className="w-full py-4 rounded-2xl border border-[#333] text-white font-medium hover:bg-[#1a1a1a] hover:border-[#444] transition-all flex items-center justify-center gap-2"
            >
              <span>✍️</span>
              <span>Paste Text Instead</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Manual Text Input */}
            {inputMethod === 'manual' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <textarea
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  placeholder="Paste the conversation here..."
                  className="w-full h-40 bg-[#1a1a1a] text-white rounded-2xl p-4 border border-[#333] focus:border-[#FF6B6B] focus:outline-none resize-none placeholder-[#555]"
                />
                {manualText && (
                  <button
                    onClick={handleManualAnalyze}
                    className="w-full bg-white text-black rounded-2xl py-4 font-bold text-lg hover:bg-gray-100 transition-colors"
                  >
                    Expose Their Intent →
                  </button>
                )}
              </motion.div>
            )}

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center"
              >
                <p className="text-red-400 text-sm">{error}</p>
                <button
                  onClick={handleReset}
                  className="mt-2 text-red-400 text-xs underline"
                >
                  Try again
                </button>
              </motion.div>
            )}
          </div>
        )}

        {/* Error during image processing */}
        {error && imagePreview && !analysisResult && !isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="rounded-2xl overflow-hidden border border-[#333]">
              <img src={imagePreview} alt="Failed" className="w-full opacity-50" />
            </div>
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
            <button
              onClick={handleReset}
              className="w-full py-4 rounded-2xl border border-[#333] text-white font-bold hover:bg-[#1a1a1a] transition-colors"
            >
              Try Another Image
            </button>
          </motion.div>
        )}
      </main>
    </div>
  );
}
