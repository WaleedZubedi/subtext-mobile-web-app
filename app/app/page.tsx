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
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowDemoIntent(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [currentDemo]);

  // Check subscription
  useEffect(() => {
    if (user && !hasSubscription) {
      // Allow them to see the UI but block analysis
      console.log('No subscription - will show paywall on analysis');
    }
  }, [user, hasSubscription]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('Image must be less than 10MB');
        return;
      }
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleUploadClick = () => {
    if (!hasSubscription) {
      router.push('/subscription');
      return;
    }
    setInputMethod('upload');
    fileInputRef.current?.click();
  };

  const handleManualInput = () => {
    if (!hasSubscription) {
      router.push('/subscription');
      return;
    }
    setInputMethod('manual');
  };

  const handleAnalyze = async () => {
    setError('');
    setIsProcessing(true);

    try {
      let textToAnalyze = '';

      if (inputMethod === 'upload' && selectedImage) {
        // Upload image for OCR
        const ocrResult = await api.uploadImageForOCR(selectedImage);
        const extractedMessages = ocrResult.ParsedResults?.[0]?.ParsedText || '';
        setExtractedText(extractedMessages);
        textToAnalyze = extractedMessages;
      } else if (inputMethod === 'manual' && manualText) {
        textToAnalyze = manualText;
        setExtractedText(manualText);
      }

      if (!textToAnalyze) {
        setError('No text to analyze');
        setIsProcessing(false);
        return;
      }

      // Parse messages (split by newlines, filter short ones)
      const messages = textToAnalyze
        .split('\n')
        .map((m) => m.trim())
        .filter((m) => m.length > 3);

      if (messages.length === 0) {
        setError('No valid messages found');
        setIsProcessing(false);
        return;
      }

      // Analyze messages
      const analysisResponse = await api.analyzeMessages(messages);
      const analysis = analysisResponse.choices?.[0]?.message?.content || '';

      // Parse the analysis
      const parsed = parseAnalysis(analysis);
      setAnalysisResult(parsed);
    } catch (err: any) {
      setError(err.message || 'Analysis failed');

      // Check if it's a subscription error
      if (err.message.includes('subscription') || err.message.includes('limit')) {
        setTimeout(() => router.push('/subscription'), 2000);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const parseAnalysis = (analysis: string) => {
    const hiddenIntentMatch = analysis.match(/\*\*Hidden Intent:\*\*\s*(.+?)(?=\*\*|$)/s);
    const behaviorTypeMatch = analysis.match(/\*\*Behavior Type:\*\*\s*(.+?)(?=\*\*|$)/s);
    const strategicReplyMatch = analysis.match(/\*\*Strategic Reply:\*\*\s*(.+?)(?=\*\*|$)/s);

    return {
      fullAnalysis: analysis,
      hiddenIntent: hiddenIntentMatch?.[1]?.trim() || 'Analysis unavailable',
      behaviorType: behaviorTypeMatch?.[1]?.trim() || 'GENERAL',
      strategicReply: strategicReplyMatch?.[1]?.trim() || 'No reply suggested',
    };
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
    // Could add a toast notification here
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
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container-mobile flex items-center justify-between py-4">
          <h1 className="text-xl font-bold">
            <span className="text-white">Sub</span>
            <span className="text-accent">Text</span>
          </h1>

          {/* Burger Menu */}
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="text-white hover:text-accent transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
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
                <button className="block w-full text-left px-4 py-2 text-muted-foreground hover:bg-background rounded-xl transition-colors">
                  Privacy Policy
                </button>
                <button className="block w-full text-left px-4 py-2 text-muted-foreground hover:bg-background rounded-xl transition-colors">
                  About
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <div className="container-mobile py-8 space-y-8">
        {/* Demo Animation Section */}
        {!analysisResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-3xl p-6 shadow-card"
          >
            <div className="flex items-center space-x-2 mb-4">
              <div className="bg-accent/20 px-3 py-1 rounded-full">
                <span className="text-accent text-xs font-bold">AI DEMO</span>
              </div>
              <span className="text-muted-foreground text-xs">96% Confidence</span>
            </div>

            {/* Demo Message Bubble */}
            <div className="relative">
              <motion.div
                key={currentDemo}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-background rounded-2xl p-4 mb-4"
              >
                <p className="text-white">{demoMessages[currentDemo].text}</p>
              </motion.div>

              {/* Scan Line Animation */}
              {!showDemoIntent && (
                <motion.div
                  className="absolute left-0 right-0 h-0.5 bg-accent shadow-glow"
                  initial={{ top: 0 }}
                  animate={{ top: '100%' }}
                  transition={{ duration: 1.5, ease: 'linear' }}
                />
              )}
            </div>

            {/* Hidden Intent Reveal */}
            <AnimatePresence mode="wait">
              {showDemoIntent && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3"
                >
                  <div className="bg-accent/10 border border-accent/30 rounded-2xl p-4">
                    <p className="text-xs text-accent font-bold mb-1">HIDDEN INTENT:</p>
                    <p className="text-white text-sm">{demoMessages[currentDemo].hiddenIntent}</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="bg-accent px-3 py-1 rounded-full">
                      <span className="text-white text-xs font-bold">
                        {demoMessages[currentDemo].behaviorType}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Training Stats */}
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-muted-foreground text-xs text-center">
                Trained on <span className="text-accent font-bold">50,000+</span> real conversations
              </p>
            </div>
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
                  <span className="text-accent text-xs font-bold">AI ANALYSIS</span>
                </div>
                <span className="text-muted-foreground text-xs">96% Confidence</span>
              </div>
              <button onClick={handleReset} className="text-accent hover:text-accent-light text-sm font-medium">
                New Analysis
              </button>
            </div>

            {/* Hidden Intent */}
            <div className="bg-accent/10 border border-accent/30 rounded-2xl p-5">
              <p className="text-xs text-accent font-bold mb-2">HIDDEN INTENT:</p>
              <p className="text-white leading-relaxed">{analysisResult.hiddenIntent}</p>
            </div>

            {/* Behavior Type Badge */}
            <div className="flex items-center space-x-2">
              <div className="bg-accent px-4 py-2 rounded-full">
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
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white text-center">
              How do you want to analyze?
            </h2>

            <div className="grid grid-cols-2 gap-4">
              {/* Upload Screenshot */}
              <button
                onClick={handleUploadClick}
                className={`p-6 rounded-3xl border-2 transition-all ${
                  inputMethod === 'upload'
                    ? 'bg-accent/10 border-accent shadow-glow'
                    : 'bg-card border-border hover:border-accent/50'
                }`}
              >
                <div className="text-4xl mb-3">📸</div>
                <p className="text-white font-medium text-sm">Upload Screenshot</p>
              </button>

              {/* Manual Input */}
              <button
                onClick={handleManualInput}
                className={`p-6 rounded-3xl border-2 transition-all ${
                  inputMethod === 'manual'
                    ? 'bg-accent/10 border-accent shadow-glow'
                    : 'bg-card border-border hover:border-accent/50'
                }`}
              >
                <div className="text-4xl mb-3">✍️</div>
                <p className="text-white font-medium text-sm">Paste Text</p>
              </button>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />

            {/* Image Preview */}
            {imagePreview && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-card rounded-3xl p-4"
              >
                <p className="text-white text-sm font-medium mb-3">Selected Image:</p>
                <img src={imagePreview} alt="Preview" className="w-full rounded-2xl" />
                <button
                  onClick={handleAnalyze}
                  className="w-full mt-4 bg-accent hover:bg-accent-dark text-white font-bold py-4 rounded-2xl shadow-glow transition-colors"
                >
                  Analyze Screenshot
                </button>
              </motion.div>
            )}

            {/* Manual Text Input */}
            {inputMethod === 'manual' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-card rounded-3xl p-6"
              >
                <label className="block text-white text-sm font-medium mb-3">
                  Paste conversation messages (one per line):
                </label>
                <textarea
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  placeholder="Paste messages here...&#10;Each line will be analyzed separately"
                  rows={8}
                  className="w-full px-4 py-3 bg-background text-white rounded-2xl border border-border focus:outline-none focus:border-accent transition-colors resize-none"
                />
                <button
                  onClick={handleAnalyze}
                  disabled={!manualText.trim()}
                  className="w-full mt-4 bg-accent hover:bg-accent-dark disabled:bg-muted text-white font-bold py-4 rounded-2xl shadow-glow transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Analyze Messages
                </button>
              </motion.div>
            )}
          </div>
        )}

        {/* Processing Animation */}
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-card rounded-3xl p-12 text-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="text-6xl mb-4 inline-block"
            >
              😈
            </motion.div>
            <p className="text-accent font-bold text-lg mb-2">Analyzing...</p>
            <p className="text-muted-foreground text-sm">
              {inputMethod === 'upload' ? 'Extracting text from image' : 'Processing messages'}
            </p>

            {/* Scan Line Effect */}
            <div className="relative mt-6 h-1 bg-background rounded-full overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 bg-accent shadow-glow"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 3, repeat: Infinity }}
              />
            </div>
          </motion.div>
        )}

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-error/10 border border-error rounded-2xl p-4"
          >
            <p className="text-error text-sm font-medium">{error}</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
