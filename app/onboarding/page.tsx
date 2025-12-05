'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import * as api from '@/lib/api';

const slides = [
  {
    title: 'Decode Hidden Intentions',
    description: 'AI analyzes conversations to reveal manipulation tactics and hidden motives',
    icon: '🔍',
  },
  {
    title: 'Identify Manipulation',
    description: 'Spot guilt-tripping, controlling behavior, and attention-seeking patterns',
    icon: '🎭',
  },
  {
    title: 'Strategic Responses',
    description: 'Get AI-powered reply suggestions that expose their game',
    icon: '💬',
  },
];

export default function Onboarding() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showDemonScan, setShowDemonScan] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const router = useRouter();

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      // Start demon scan animation
      setShowDemonScan(true);

      // Complete after animation
      setTimeout(() => {
        setScanComplete(true);
        api.markOnboardingComplete();
        router.push('/signup');
      }, 3000);
    }
  };

  const handleSkip = () => {
    api.markOnboardingComplete();
    router.push('/signup');
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Demon Scan Animation Overlay */}
      <AnimatePresence>
        {showDemonScan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-background"
          >
            {/* Scan Line */}
            <motion.div
              className="absolute inset-0 overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                className="absolute left-0 right-0 h-1 bg-accent shadow-glow-strong"
                initial={{ top: '-10%' }}
                animate={{ top: '110%' }}
                transition={{ duration: 2, ease: 'linear' }}
              />
            </motion.div>

            {/* Demon Emoji with Glitch Effect */}
            <motion.div
              className="text-9xl"
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: [0, 1.2, 1],
                opacity: [0, 1, 1],
              }}
              transition={{ duration: 1, times: [0, 0.6, 1] }}
            >
              <motion.div
                animate={{
                  x: [0, -5, 5, -5, 5, 0],
                  opacity: [1, 0.8, 1, 0.8, 1, 1],
                }}
                transition={{
                  duration: 0.3,
                  times: [0, 0.2, 0.4, 0.6, 0.8, 1],
                  delay: 0.8,
                }}
              >
                😈
              </motion.div>
            </motion.div>

            {/* Red Flash Effect */}
            <motion.div
              className="absolute inset-0 bg-accent"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.3, 0] }}
              transition={{ duration: 0.3, delay: 0.8 }}
            />

            {/* Scanning Text */}
            <motion.div
              className="absolute bottom-20 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <p className="text-accent font-bold text-lg">Scanning...</p>
              <p className="text-muted-foreground text-sm mt-2">
                Initializing AI analysis
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Crime Scene Tape Background */}
      <div className="absolute top-10 left-0 right-0 transform -rotate-3 bg-accent/20 py-2 overflow-hidden">
        <div className="text-accent text-xs font-bold tracking-wider">
          ⚠️ CAUTION • MANIPULATION DETECTED • CAUTION • MANIPULATION DETECTED ⚠️
        </div>
      </div>

      <div className="absolute bottom-10 left-0 right-0 transform rotate-3 bg-accent/20 py-2 overflow-hidden">
        <div className="text-accent text-xs font-bold tracking-wider">
          ⚠️ CAUTION • MANIPULATION DETECTED • CAUTION • MANIPULATION DETECTED ⚠️
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6">
        {/* Skip Button */}
        <button
          onClick={handleSkip}
          className="absolute top-8 right-6 text-muted-foreground hover:text-accent transition-colors font-medium"
        >
          Skip
        </button>

        {/* Logo */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold">
            <span className="text-white">Sub</span>
            <span className="text-accent">Text</span>
          </h1>
        </div>

        {/* Slides */}
        <div className="w-full max-w-md mb-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              <div className="text-7xl mb-6">{slides[currentSlide].icon}</div>
              <h2 className="text-2xl font-bold text-white mb-4">
                {slides[currentSlide].title}
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                {slides[currentSlide].description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Pagination Dots */}
        <div className="flex space-x-2 mb-12">
          {slides.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? 'w-8 bg-accent'
                  : 'w-2 bg-muted-foreground/30'
              }`}
            />
          ))}
        </div>

        {/* Next Button */}
        <button
          onClick={handleNext}
          className="bg-accent hover:bg-accent-dark text-white font-bold py-4 px-12 rounded-full shadow-glow transition-all transform hover:scale-105"
        >
          {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
        </button>

        {/* Training Stats */}
        <div className="mt-12 text-center">
          <p className="text-muted-foreground text-sm">
            Trained on <span className="text-accent font-bold">50,000+</span>{' '}
            real conversations
          </p>
        </div>
      </div>
    </div>
  );
}
