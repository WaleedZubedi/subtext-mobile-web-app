'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import * as api from '@/lib/api';

// Demo messages for animation
const demoMessages = [
  {
    text: "I guess I'll just be alone tonight... again 😔",
    hiddenIntent: "Fishing for sympathy and attention",
    behaviorType: "ATTENTION-SEEKING",
  },
  {
    text: "You never text me first anymore...",
    hiddenIntent: "Guilt-tripping to gain control",
    behaviorType: "CONTROLLING",
  },
  {
    text: "I'm fine. Do whatever you want.",
    hiddenIntent: "Passive-aggressive manipulation",
    behaviorType: "GUILT-TRIPPING",
  },
  {
    text: "Nobody cares about me anyway",
    hiddenIntent: "Emotional manipulation for validation",
    behaviorType: "ATTENTION-SEEKING",
  },
];

export default function AppScreen() {
  const { user, hasSubscription, logout, loading } = useAuth();
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [currentDemo, setCurrentDemo] = useState(0);
  const [showDemoIntent, setShowDemoIntent] = useState(false);

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

  // Redirect if not logged in (wait for auth to finish loading first)
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Demo message animation
  useEffect(() => {
    const interval = setInterval(() => {
      setShowDemoIntent(false);
      setTimeout(() => {
        setCurrentDemo((prev) => (prev + 1) % demoMessages.length);
      }, 300);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowDemoIntent(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [currentDemo]);

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

  // Show loading screen while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">😈</div>
          <p className="text-accent font-bold">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container-mobile flex items-center justify-between py-4">
          <div className="flex-1"></div>
          <h1 className="text-xl font-bold text-center">
            <span className="text-white">Sub</span>
            <span className="text-accent">Text</span>
          </h1>
          <div className="flex-1 flex justify-end">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="text-white hover:text-accent transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
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
              className="border-t border-border bg-card"
            >
              <div className="container-mobile py-3 space-y-2">
                <button onClick={() => router.push('/settings')} className="block w-full text-left px-4 py-2 text-white hover:bg-background rounded-xl transition-colors">
                  Settings
                </button>
                <button onClick={() => router.push('/subscription')} className="block w-full text-left px-4 py-2 text-white hover:bg-background rounded-xl transition-colors">
                  Subscription
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <div className="container-mobile py-8 space-y-8">
        {/* Demo Animation Section */}
        {!analysisResult && !isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-3xl p-6 shadow-card overflow-hidden"
          >
            <div className="flex items-center space-x-2 mb-4">
              <div className="bg-accent/20 px-3 py-1 rounded-full">
                <span className="text-accent text-xs font-bold">AI DEMO</span>
              </div>
              <span className="text-muted-foreground text-xs">Live Preview</span>
            </div>

            {/* Demo Message with Scan Animation */}
            <div className="relative mb-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentDemo}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="bg-background rounded-2xl p-4 relative overflow-hidden"
                >
                  <p className="text-white relative z-10">{demoMessages[currentDemo].text}</p>

                  {/* Smooth Scan Line */}
                  {!showDemoIntent && (
                    <motion.div
                      className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-80"
                      style={{
                        boxShadow: '0 0 10px rgba(255, 107, 107, 0.8)',
                        filter: 'blur(1px)'
                      }}
                      initial={{ top: '-10px' }}
                      animate={{ top: '110%' }}
                      transition={{
                        duration: 1.8,
                        ease: 'linear'
                      }}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Hidden Intent Reveal */}
            <AnimatePresence mode="wait">
              {showDemoIntent && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-3"
                >
                  <div className="bg-accent/10 border border-accent/30 rounded-2xl p-4">
                    <p className="text-xs text-accent font-bold mb-1">HIDDEN INTENT:</p>
                    <p className="text-white text-sm">{demoMessages[currentDemo].hiddenIntent}</p>
                  </div>

                  <div className="flex items-center justify-center">
                    <motion.div
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      className="bg-accent px-4 py-2 rounded-full shadow-glow"
                    >
                      <span className="text-white text-xs font-bold">
                        {demoMessages[currentDemo].behaviorType}
                      </span>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Training Stats */}
            <div className="mt-6 pt-4 border-t border-border">
              <p className="text-muted-foreground text-xs text-center">
                Trained on <span className="text-accent font-bold">50,000+</span> real conversations
              </p>
            </div>
          </motion.div>
        )}

        {/* Processing Animation */}
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-card rounded-3xl p-12 shadow-card text-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="text-6xl mb-4"
            >
              😈
            </motion.div>
            <p className="text-accent font-bold text-lg">Analyzing...</p>
            <p className="text-muted-foreground text-sm mt-2">Decoding hidden intentions</p>
          </motion.div>
        )}

        {/* Analysis Result */}
        {analysisResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-3xl p-6 shadow-card space-y-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="bg-accent/20 px-3 py-1 rounded-full">
                  <span className="text-accent text-xs font-bold">ANALYSIS COMPLETE</span>
                </div>
              </div>
              <button onClick={handleReset} className="text-accent hover:text-accent-light text-sm font-medium">
                New Analysis
              </button>
            </div>

            {/* Hidden Intent */}
            <div className="bg-accent/10 border border-accent/30 rounded-2xl p-5">
              <p className="text-xs text-accent font-bold mb-2">🎯 HIDDEN INTENT:</p>
              <p className="text-white leading-relaxed">{analysisResult.hiddenIntent}</p>
            </div>

            {/* Behavior Type Badge */}
            <div className="flex items-center justify-center">
              <div className="bg-accent px-4 py-2 rounded-full shadow-glow">
                <span className="text-white text-sm font-bold">
                  {analysisResult.behaviorType}
                </span>
              </div>
            </div>

            {/* Strategic Reply */}
            <div className="bg-background rounded-2xl p-5 border border-border">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">🛡️</span>
                  <p className="text-xs text-accent font-bold">STRATEGIC REPLY:</p>
                </div>
                <button
                  onClick={() => copyToClipboard(analysisResult.strategicReply)}
                  className="text-accent hover:text-accent-light text-xs font-medium"
                >
                  Copy
                </button>
              </div>
              <p className="text-white leading-relaxed">{analysisResult.strategicReply}</p>
            </div>
          </motion.div>
        )}

        {/* Input Methods */}
        {!analysisResult && !isProcessing && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white text-center">
              Start Your Analysis
            </h2>

            <div className="grid grid-cols-2 gap-4">
              {/* Upload Screenshot */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleUploadClick}
                className={`p-6 rounded-3xl border-2 transition-all ${
                  inputMethod === 'upload'
                    ? 'bg-accent/10 border-accent shadow-glow'
                    : 'bg-card border-border hover:border-accent/50'
                }`}
              >
                <div className="text-4xl mb-3">📸</div>
                <p className="text-white font-medium text-sm">Upload</p>
                <p className="text-muted-foreground text-xs mt-1">Screenshot</p>
              </motion.button>

              {/* Manual Input */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleManualInput}
                className={`p-6 rounded-3xl border-2 transition-all ${
                  inputMethod === 'manual'
                    ? 'bg-accent/10 border-accent shadow-glow'
                    : 'bg-card border-border hover:border-accent/50'
                }`}
              >
                <div className="text-4xl mb-3">✍️</div>
                <p className="text-white font-medium text-sm">Type</p>
                <p className="text-muted-foreground text-xs mt-1">Manually</p>
              </motion.button>
            </div>

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
                className="bg-card rounded-3xl p-4 shadow-card"
              >
                <img src={imagePreview} alt="Preview" className="w-full rounded-2xl" />
              </motion.div>
            )}

            {/* Manual Text Input */}
            {inputMethod === 'manual' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-3xl p-6 shadow-card"
              >
                <textarea
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  placeholder="Paste or type the conversation here..."
                  className="w-full h-40 bg-background text-white rounded-2xl p-4 border border-border focus:border-accent focus:outline-none resize-none"
                />
              </motion.div>
            )}

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-error/10 border border-error rounded-2xl p-4 text-center"
              >
                <p className="text-error text-sm">{error}</p>
              </motion.div>
            )}

            {/* Analyze Button */}
            {(selectedImage || manualText) && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAnalyze}
                className="w-full bg-accent hover:bg-accent-dark text-white font-bold py-4 rounded-3xl shadow-glow transition-all"
              >
                Analyze Conversation
              </motion.button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
