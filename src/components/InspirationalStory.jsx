import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { VITE_BACKEND_URL } from '../googleConfig';

const STORY_MODES = ["Hopeful", "Motivational", "Funny", "Emotional", "Reflective"];

const InspirationalStory = ({ videoId }) => {
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState('Hopeful');
  const [story, setStory] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!videoId) {
      setError('Please upload a video first to generate content-based stories');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setStory('');
    
    try {
      // Use the content-based endpoint that analyzes actual video content
      const res = await axios.post(`${VITE_BACKEND_URL}/generate-content-story`, {
        videoId: videoId,
        mode: mode,
        prompt: prompt.trim() // Optional additional context
      });
      
      setStory(res.data?.story || '');
    } catch (e) {
      console.error('Content-based story generation error:', e);
      setError(e?.response?.data?.error || 'Failed to generate content-based story. Make sure you have uploaded a video.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      id="inspirational-story-section"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      className="relative overflow-hidden rounded-xl p-8 border border-white/20 shadow-xl"
      style={{
        background: 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(168,85,247,0.15) 100%)'
      }}
    >
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-md"
            title="Create content-based inspirational stories from your video"
          >
            <span className="text-white text-base">✨</span>
          </motion.div>
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Content-Based Inspirational Storytelling</h2>
            <p className="text-sm text-white/70">AI analyzes your video content to create personalized inspirational stories</p>
            <p className="text-xs text-white/50 mt-1">Uses your video's transcript, visual elements, and key moments to generate authentic stories</p>
          </div>
        </div>
      </div>

      {!videoId && (
        <div className="mb-4 p-3 bg-yellow-500/20 backdrop-blur-md border border-yellow-400/30 rounded-md">
          <p className="text-yellow-200 text-sm">⚠️ Please upload a video first to generate content-based stories</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 max-w-4xl">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Optional: Add context or focus area (e.g., focus on relationships, highlight achievements)"
          className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-base"
        />
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          className="w-full sm:w-48 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-md"
        >
          {STORY_MODES.map(m => (
            <option key={m} value={m} className="bg-purple-800">{m}</option>
          ))}
        </select>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={isLoading || !videoId}
          onClick={handleGenerate}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          {isLoading ? 'Analyzing Video...' : 'Create Content Story'}
        </motion.button>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-500/20 backdrop-blur-md border border-red-400/30 rounded-md">
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}

      <AnimatePresence>
        {story && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-6 bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 shadow-xl"
          >
            <div className="prose prose-invert max-w-none">
              <p className="whitespace-pre-wrap text-white/90 leading-relaxed">{story}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default InspirationalStory;



