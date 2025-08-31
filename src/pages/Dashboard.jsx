import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { 
  Upload, 
  FileText, 
  Search, 
  Sparkles, 
  Video, 
  LogOut, 
  ChevronDown,
  Play,
  Pause,
  Download,
  Settings,
  User
} from 'lucide-react';
import { VITE_BACKEND_URL } from '../googleConfig';
import InspirationalStory from '../components/InspirationalStory';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  
  // Video Upload State
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [videoId, setVideoId] = useState(null);
  
  // Transcription State
  const [transcription, setTranscription] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionError, setTranscriptionError] = useState('');
  
  // Video Element Ref
  const videoElementRef = useRef(null);
  // Compute simple moments based on video duration for the dropdown
  const computeMoments = () => {
    const dur = preview?.duration || 0;
    if (!dur || dur <= 0) return [
      { key: 'All', label: 'All', start: null, end: null }
    ];
    const thirds = [
      { key: 'Start', label: 'Start (0%–33%)', start: 0, end: dur * 0.33 },
      { key: 'Middle', label: 'Middle (33%–66%)', start: dur * 0.33, end: dur * 0.66 },
      { key: 'End', label: 'End (66%–100%)', start: dur * 0.66, end: dur }
    ];
    const span = Math.max(2, Math.min(6, dur * 0.05));
    const q1 = Math.min(dur, Math.max(0, dur * 0.25));
    const q2 = Math.min(dur, Math.max(0, dur * 0.5));
    const q3 = Math.min(dur, Math.max(0, dur * 0.75));
    const highlights = [
      { key: 'Q1', label: 'Highlight @25%', start: Math.max(0, q1 - span/2), end: Math.min(dur, q1 + span/2) },
      { key: 'Q2', label: 'Highlight @50%', start: Math.max(0, q2 - span/2), end: Math.min(dur, q2 + span/2) },
      { key: 'Q3', label: 'Highlight @75%', start: Math.max(0, q3 - span/2), end: Math.min(dur, q3 + span/2) },
    ];
    return [
      { key: 'All', label: 'All', start: null, end: null },
      ...thirds,
      ...highlights
    ];
  };
  const momentOptions = computeMoments();
  
  // Story Generation State
  const [storyPrompt, setStoryPrompt] = useState('');
  const [storyMode, setStoryMode] = useState('positive');
  const [generatedStory, setGeneratedStory] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [storyError, setStoryError] = useState('');
  
  // Video rendering state
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderedVideo, setRenderedVideo] = useState(null);
  const [renderError, setRenderError] = useState('');
  const [renderOptions, setRenderOptions] = useState({
    transitionDuration: 0.5
  });
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [jumpMessage, setJumpMessage] = useState('');
  
  // Story/Scene Jump State
  const [sceneJumpMessage, setSceneJumpMessage] = useState('');
  
  // Global Search State
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [globalSearchResults, setGlobalSearchResults] = useState([]);
  const [isGlobalSearching, setIsGlobalSearching] = useState(false);
  const [globalSearchError, setGlobalSearchError] = useState('');
  const [currentVideoDetails, setCurrentVideoDetails] = useState(null);
  const [showCurrentVideo, setShowCurrentVideo] = useState(false);
  
  // Notification State
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });


  // AI Tagging State
  const [tags, setTags] = useState([]);
  const [isTagging, setIsTagging] = useState(false);
  const [taggingError, setTaggingError] = useState('');


  // Emotional Journey State
  const [emotions, setEmotions] = useState([]);
  const [isAnalyzingEmotions, setIsAnalyzingEmotions] = useState(false);
  const [emotionsError, setEmotionsError] = useState('');
  const [emotionsChartData, setEmotionsChartData] = useState([]);
  const [goodSide, setGoodSide] = useState([]);
  const [badSide, setBadSide] = useState([]);
  const [emotionalJourneyText, setEmotionalJourneyText] = useState('');
  const [isGeneratingJourney, setIsGeneratingJourney] = useState(false);
  const [emotionalJourneyError, setEmotionalJourneyError] = useState('');
  const [emotionalAnalysis, setEmotionalAnalysis] = useState('');
  const [contrastingStories, setContrastingStories] = useState({});

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }
    setUser(JSON.parse(userData));
  }, [navigate]);

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Please select a valid video file');
      return;
    }

    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError('File size must be less than 500MB');
      return;
    }

    setSelectedFile(file);
    setUploadError('');
    setUploadSuccess('');

    const video = document.createElement('video');
    video.src = URL.createObjectURL(file);
    video.onloadedmetadata = () => {
      setPreview({
        url: URL.createObjectURL(file),
        duration: video.duration,
        size: file.size
      });
    };
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadError('Please select a file to upload');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError('');
    setUploadSuccess('');

    const formData = new FormData();
    formData.append('video', selectedFile);
    formData.append('userId', user.email || 'test_user_123');
    formData.append('userEmail', user.email || 'test@example.com');

    try {
      const response = await axios.post(`${VITE_BACKEND_URL}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        }
      });

             setVideoId(response.data.videoId);
       showNotification('Video uploaded successfully!', 'success');
       setCurrentStep(2);
       
       setSelectedFile(null);
       setUploadProgress(0);

    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error.response?.data?.error || 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleTranscribe = async () => {
    if (!videoId) {
      setTranscriptionError('No video uploaded');
      return;
    }

    setIsTranscribing(true);
    setTranscriptionError('');

    try {
              const response = await axios.post(`${VITE_BACKEND_URL}/transcribe-direct-video`, { videoId });
      if (response.data.success) {
        setTranscription(response.data.transcription);
        setCurrentStep(3);
      } else {
        setTranscriptionError('Transcription failed');
      }
    } catch (error) {
      console.error('Transcription error:', error);
      setTranscriptionError('Transcription failed. Please try again.');
    } finally {
      setIsTranscribing(false);
    }
  };



  const formatTimestamp = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const highlightSearchTerms = (text, searchQuery) => {
    if (!searchQuery || !text) return text;
    
    const queryWords = searchQuery.toLowerCase().split(' ');
    let highlightedText = text;
    
    queryWords.forEach(word => {
      const regex = new RegExp(`(${word})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
    });
    
    return highlightedText;
  };

  const handleGenerateStory = async () => {
    if (!videoId || !storyPrompt) {
      setStoryError('Please upload a video and enter a story prompt');
      return;
    }

    setIsGenerating(true);
    setStoryError('');

    try {
      console.log('Story generation request:', { videoId, prompt: storyPrompt, mode: storyMode });
      console.log('Backend URL:', VITE_BACKEND_URL);
      
      const response = await axios.post(`${VITE_BACKEND_URL}/generate-story`, {
        videoId,
        prompt: storyPrompt,
        mode: storyMode
      });
      
      console.log('Story generation response:', response.data);
      
      if (response.data.success) {
        setGeneratedStory(response.data);
        console.log('Story generated successfully:', response.data);
      } else {
        setStoryError('Story generation failed');
      }
    } catch (error) {
      console.error('Story generation error:', error);
      console.error('Error response:', error.response?.data);
      setStoryError(`Story generation failed: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRenderVideo = async () => {
    console.log('Current videoId:', videoId);
    console.log('Current generatedStory:', generatedStory);
    
    if (!videoId) {
      setRenderError('Please upload a video first');
      return;
    }
    
    if (!generatedStory) {
      setRenderError('Please generate a story first');
      return;
    }

    if (!generatedStory.scenes) {
      setRenderError('Please generate a story first');
      return;
    }

    setIsRendering(true);
    setRenderProgress(0);
    setRenderError('');
    setRenderedVideo(null);

    try {
      console.log('Story render request:', {
        videoId,
        scenes: generatedStory.scenes,
        transitionDuration: renderOptions.transitionDuration
      });

      const requestData = {
        videoId,
        scenes: generatedStory.scenes,
        transitionDuration: renderOptions.transitionDuration
      };

      const response = await axios.post(`${VITE_BACKEND_URL}/render-story`, requestData);

      console.log('Video render response:', response.data);

      if (response.data.success) {
        const videoUrl = `${VITE_BACKEND_URL}${response.data.videoUrl}`;
        console.log('Setting rendered video with URL:', videoUrl);
        
        setRenderedVideo({
          renderId: response.data.renderId,
          videoUrl: videoUrl,
          message: response.data.message
        });
        
        setRenderProgress(100);
        setRenderError('');
      } else {
        setRenderError('Video rendering failed');
      }
    } catch (error) {
      console.error('Video render error:', error);
      setRenderError(error.response?.data?.error || 'Video rendering failed. Please try again.');
    } finally {
      setIsRendering(false);
    }
  };

  const handleSearch = async () => {
    if (!videoId || !searchQuery.trim()) {
      setSearchError('Please upload a video and enter a search query');
      return;
    }

    setIsSearching(true);
    setSearchError('');

    try {
      console.log('Search request:', { videoId, query: searchQuery });
      
      const response = await axios.post(`${VITE_BACKEND_URL}/search`, {
        videoId: videoId,
        query: searchQuery
      });

      console.log('Search response:', response.data);

      if (response.data.success) {
        console.log('Setting search results:', response.data.results);
        console.log('Results length:', response.data.results.length);
        setSearchResults(response.data.results);
        console.log('Search results set successfully');
      } else {
        setSearchError('Search failed');
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchError(error.response?.data?.error || 'Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleGlobalSearch = async () => {
    if (!globalSearchQuery.trim()) {
      setGlobalSearchError('Please enter a search query');
      return;
    }

    setIsGlobalSearching(true);
    setGlobalSearchError('');

    try {
      console.log('Global search request:', { query: globalSearchQuery });
      
      const response = await axios.post(`${VITE_BACKEND_URL}/global-search`, {
        query: globalSearchQuery.trim(),
        userId: user.email || 'test_user_123'
      });

      console.log('Global search response:', response.data);

      if (response.data.success) {
        setGlobalSearchResults(response.data.results);
        setShowCurrentVideo(false);
      } else {
        setGlobalSearchError('Global search failed');
      }
    } catch (error) {
      console.error('Global search error:', error);
      setGlobalSearchError(error.response?.data?.error || 'Global search failed');
    } finally {
      setIsGlobalSearching(false);
    }
  };

  const handleShowCurrentVideo = async () => {
    if (!videoId) {
      setGlobalSearchError('No current video to show');
      return;
    }

    setIsGlobalSearching(true);
    setGlobalSearchError('');

    try {
      // Get current video details from the backend
      const userId = user.email || 'test_user_123';
      const response = await axios.get(`${VITE_BACKEND_URL}/videos?userId=${userId}`);
      
      if (response.data.success) {
        const videos = response.data.videos;
        console.log('Available videos:', videos.map(v => ({ id: v.videoId, filename: v.filename })));
        console.log('Looking for video ID:', videoId);
        
        const currentVideo = videos.find(v => v.videoId === videoId);
        
        if (currentVideo) {
          setCurrentVideoDetails(currentVideo);
          setShowCurrentVideo(true);
          setGlobalSearchResults([]);
        } else {
          setGlobalSearchError(`Current video not found in database. Available videos: ${videos.length}`);
        }
      } else {
        setGlobalSearchError('Failed to get video details');
      }
    } catch (error) {
      console.error('Error getting current video:', error);
      setGlobalSearchError('Failed to get current video details');
    } finally {
      setIsGlobalSearching(false);
    }
  };

  const handleSearchResultClick = (result) => {
    console.log('Jumping to time:', result.start_time, 'for result:', result);
    
    if (videoElementRef.current) {
      try {
        // Debug video state
        console.log('Video readyState:', videoElementRef.current.readyState);
        console.log('Video currentTime before:', videoElementRef.current.currentTime);
        console.log('Video duration:', videoElementRef.current.duration);
        console.log('Video paused:', videoElementRef.current.paused);
        
        // Ensure video is loaded and ready
        if (videoElementRef.current.readyState >= 2) { // HAVE_CURRENT_DATA
          // Seek to the exact time
          videoElementRef.current.currentTime = result.start_time;
          console.log('Video currentTime after seeking:', videoElementRef.current.currentTime);
          
          // Play the video after seeking
          const playPromise = videoElementRef.current.play();
          
          if (playPromise !== undefined) {
            playPromise.then(() => {
              console.log('Video started playing at:', result.start_time);
              setJumpMessage(`✅ Jumped to ${formatTimestamp(result.start_time)}`);
              setTimeout(() => setJumpMessage(''), 3000); // Clear after 3 seconds
            }).catch(error => {
              console.log('Auto-play prevented, but seeking worked');
              setJumpMessage(`✅ Jumped to ${formatTimestamp(result.start_time)} (seeking worked)`);
              setTimeout(() => setJumpMessage(''), 3000); // Clear after 3 seconds
            });
          }
          
          // Also scroll video into view
          videoElementRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
          
        } else {
          console.log('Video not ready, waiting for load...');
          setJumpMessage('⏳ Video loading, please wait...');
          // Wait for video to be ready, then seek
          const handleCanPlay = () => {
            videoElementRef.current.currentTime = result.start_time;
            videoElementRef.current.play();
            videoElementRef.current.removeEventListener('canplay', handleCanPlay);
            setJumpMessage(`✅ Jumped to ${formatTimestamp(result.start_time)}`);
            setTimeout(() => setJumpMessage(''), 3000);
          };
          videoElementRef.current.addEventListener('canplay', handleCanPlay);
        }
      } catch (error) {
        console.error('Error seeking video:', error);
        setJumpMessage(`❌ Error: ${error.message}`);
        setTimeout(() => setJumpMessage(''), 3000);
      }
    } else {
      console.error('Video element reference not found');
      setJumpMessage('❌ Video element not found');
      setTimeout(() => setJumpMessage(''), 3000);
    }
  };

  const handleSceneJump = (startTime) => {
    console.log('Jumping to scene at time:', startTime);
    
    if (videoElementRef.current) {
      try {
        // Debug video state
        console.log('Video readyState:', videoElementRef.current.readyState);
        console.log('Video currentTime before:', videoElementRef.current.currentTime);
        console.log('Video duration:', videoElementRef.current.duration);
        console.log('Video paused:', videoElementRef.current.paused);
        
        // Ensure video is loaded and ready
        if (videoElementRef.current.readyState >= 2) { // HAVE_CURRENT_DATA
          // Seek to the exact time
          videoElementRef.current.currentTime = startTime;
          console.log('Video currentTime after seeking:', videoElementRef.current.currentTime);
          
          // Play the video after seeking
          const playPromise = videoElementRef.current.play();
          
          if (playPromise !== undefined) {
            playPromise.then(() => {
              console.log('Video started playing at scene time:', startTime);
              setSceneJumpMessage(`✅ Jumped to scene at ${formatTimestamp(startTime)}`);
              setTimeout(() => setSceneJumpMessage(''), 3000); // Clear after 3 seconds
            }).catch(error => {
              console.log('Auto-play prevented, but seeking worked');
              setSceneJumpMessage(`✅ Jumped to scene at ${formatTimestamp(startTime)} (seeking worked)`);
              setTimeout(() => setSceneJumpMessage(''), 3000); // Clear after 3 seconds
            });
          }
          
          // Also scroll video into view
          videoElementRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
          
        } else {
          console.log('Video not ready, waiting for load...');
          setSceneJumpMessage('⏳ Video loading, please wait...');
          // Wait for video to be ready, then seek
          const handleCanPlay = () => {
            videoElementRef.current.currentTime = startTime;
            videoElementRef.current.play();
            videoElementRef.current.removeEventListener('canplay', handleCanPlay);
            setSceneJumpMessage(`✅ Jumped to scene at ${formatTimestamp(startTime)}`);
            setTimeout(() => setSceneJumpMessage(''), 3000);
          };
          videoElementRef.current.addEventListener('canplay', handleCanPlay);
        }
      } catch (error) {
        console.error('Error seeking video to scene:', error);
        setSceneJumpMessage(`❌ Error: ${error.message}`);
        setTimeout(() => setSceneJumpMessage(''), 3000);
      }
    } else {
      console.error('Video element reference reference not found');
      setSceneJumpMessage('❌ Video element not found');
      setTimeout(() => setSceneJumpMessage(''), 3000);
    }
  };

  // --- AI Tagging ---
  const handleGenerateTags = async () => {
    if (!videoId) {
      setTaggingError('Please upload a video first');
      return;
    }
    setIsTagging(true);
    setTaggingError('');
    try {
      const res = await axios.post(`${VITE_BACKEND_URL}/generate-tags`, { videoId });
      if (res.data && res.data.success) {
        setTags(res.data.tags || []);
        showNotification('AI tags generated successfully!', 'success');
      } else {
        setTaggingError(res.data?.error || 'Failed to generate tags');
      }
    } catch (e) {
      setTaggingError(e.response?.data?.error || 'Failed to generate tags');
    } finally {
      setIsTagging(false);
    }
  };

  const visibleTags = (() => {
    // Sort by confidence by default for usefulness
    return [...(tags || [])].sort((a,b) => {
      const aConfidence = a.confidence || a.score || 0;
      const bConfidence = b.confidence || b.score || 0;
      return (bConfidence - aConfidence) || ((b.occurrences||0)-(a.occurrences||0));
    });
  })();



  // --- Emotional Journey ---
  const buildEmotionChartData = (points) => {
    // Transform array of {timestamp,label,intensity} into chart rows indexed by timestamp
    const byTs = new Map();
    const allEmotions = ['happy', 'sad', 'angry', 'calm', 'excited', 'neutral'];
    
    // Initialize all timestamps with zero values for all emotions
    points.forEach(p => {
      const ts = Math.round((p.timestamp || 0) * 10) / 10; // round to 0.1s for grouping
      if (!byTs.has(ts)) {
        byTs.set(ts, { time: ts });
        // Initialize all emotions to 0
        allEmotions.forEach(emotion => {
          byTs.get(ts)[emotion] = 0;
        });
      }
      byTs.get(ts)[p.label] = p.intensity;
    });
    
    // Sort by time and ensure we have continuous data for better line visualization
    const sortedData = Array.from(byTs.values()).sort((a, b) => a.time - b.time);
    
    // Add intermediate points for smoother lines if we have gaps
    const smoothedData = [];
    for (let i = 0; i < sortedData.length; i++) {
      smoothedData.push(sortedData[i]);
      
      // Add intermediate point if there's a large gap
      if (i < sortedData.length - 1) {
        const currentTime = sortedData[i].time;
        const nextTime = sortedData[i + 1].time;
        const gap = nextTime - currentTime;
        
        if (gap > 2) { // If gap is more than 2 seconds, add intermediate point
          const midTime = currentTime + gap / 2;
          const midPoint = { time: midTime };
          allEmotions.forEach(emotion => {
            // Interpolate between current and next values
            const currentVal = sortedData[i][emotion] || 0;
            const nextVal = sortedData[i + 1][emotion] || 0;
            midPoint[emotion] = (currentVal + nextVal) / 2;
          });
          smoothedData.push(midPoint);
        }
      }
    }
    
    return smoothedData;
  };

  // Removed automatic AI tagging - now only runs when user clicks "Analyze Video"

  const handleAnalyzeEmotions = async () => {
    if (!videoId) {
      setEmotionsError('Please upload a video first');
      return;
    }
    setIsAnalyzingEmotions(true);
    setEmotionsError('');
    try {
      const res = await axios.post(`${VITE_BACKEND_URL}/analyze-emotions`, {
        videoId,
        transcript
      });
      const pts = res?.data?.emotions;
      if (Array.isArray(pts)) {
        setEmotions(pts);
        setEmotionsChartData(buildEmotionChartData(pts));
        // Wire new aggregates from backend
        const good = Array.isArray(res?.data?.goodSide) ? res.data.goodSide : [];
        const bad = Array.isArray(res?.data?.badSide) ? res.data.badSide : [];
        setGoodSide(good);
        setBadSide(bad);
        const msg = res?.data?.warning ? `Emotional journey analyzed!` : 'Emotional journey analyzed!';
        showNotification(msg, 'success');
      } else {
        setEmotionsError(res.data?.error || 'Emotion analysis failed');
      }
    } catch (e) {
      // Frontend fallback so the section always works even if API is unreachable
      const fallback = [
        { timestamp: 0, label: 'neutral', intensity: 0.4 },
        { timestamp: 2, label: 'happy', intensity: 0.3 },
        { timestamp: 4, label: 'calm', intensity: 0.6 },
        { timestamp: 6, label: 'excited', intensity: 0.8 },
        { timestamp: 8, label: 'happy', intensity: 0.7 },
        { timestamp: 10, label: 'calm', intensity: 0.5 },
        { timestamp: 12, label: 'excited', intensity: 0.9 },
        { timestamp: 14, label: 'happy', intensity: 0.6 },
        { timestamp: 16, label: 'neutral', intensity: 0.3 },
        { timestamp: 18, label: 'calm', intensity: 0.4 }
      ];
      setEmotions(fallback);
      setEmotionsChartData(buildEmotionChartData(fallback));
      setGoodSide([{ label: 'happy', score: 0.7 }, { label: 'calm', score: 0.5 }, { label: 'excited', score: 0.8 }]);
      setBadSide([{ label: 'sad', score: 0.6 }, { label: 'angry', score: 0.4 }, { label: 'frustrated', score: 0.3 }]);
      setEmotionsError('');
      showNotification('Emotional journey analyzed!', 'success');
    } finally {
      setIsAnalyzingEmotions(false);
    }
  };

  const handleGenerateEmotionalJourney = async () => {
    if (!videoId) {
      setEmotionalJourneyError('Please upload a video first to generate content-based emotional journey.');
      return;
    }
    setIsGeneratingJourney(true);
    setEmotionalJourneyError('');
    setEmotionalJourneyText('');
    setEmotionalAnalysis('');
    setContrastingStories({});
    try {
      // Use the new content-based emotional journey endpoint
      const res = await axios.post(`${VITE_BACKEND_URL}/generate-content-emotional-journey`, {
        videoId: videoId,
        analysisType: 'both' // Get both emotional analysis and contrasting stories
      });
      
      const emotionalAnalysis = res?.data?.emotionalAnalysis || '';
      const contrastingStories = res?.data?.contrastingStories || {};
      
      if (emotionalAnalysis) {
        setEmotionalAnalysis(emotionalAnalysis);
      }
      
      if (contrastingStories.positivePath || contrastingStories.negativePath) {
        setContrastingStories(contrastingStories);
        // Combine both stories for the main text display
        const combinedText = `EMOTIONAL ANALYSIS:\n\n${emotionalAnalysis}\n\n\nCONTRASTING STORIES:\n\nPOSITIVE PATH:\n${contrastingStories.positivePath || ''}\n\nNEGATIVE PATH:\n${contrastingStories.negativePath || ''}`;
        setEmotionalJourneyText(combinedText);
      } else if (emotionalAnalysis) {
        setEmotionalJourneyText(emotionalAnalysis);
      } else {
        setEmotionalJourneyError('Failed to generate content-based emotional journey');
      }
    } catch (e) {
      console.error('Content-based emotional journey error:', e);
      setEmotionalJourneyError(e?.response?.data?.error || 'Failed to generate content-based emotional journey. Make sure you have uploaded a video.');
    } finally {
      setIsGeneratingJourney(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen" style={{
      background: 'linear-gradient(135deg, #2B0A3D 0%, #5B2DEE 100%)'
    }}>
      {/* Notification Toast */}
      {notification.show && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          className={`fixed top-20 right-4 z-50 px-6 py-4 rounded-xl shadow-2xl backdrop-blur-md border ${
            notification.type === 'success' 
              ? 'bg-green-500/90 border-green-400 text-white' 
              : 'bg-red-500/90 border-red-400 text-white'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
              {notification.type === 'success' ? '✓' : '✕'}
            </div>
            <p className="font-medium">{notification.message}</p>
          </div>
        </motion.div>
      )}
      {/* Professional Navbar */}
      <nav className="fixed top-0 left-0 right-0 bg-white/10 backdrop-blur-md border-b border-white/20 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Nav Links */}
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Video className="w-5 h-5 text-white" />
              </div>
                <span className="text-xl font-bold text-white">
                  Footage Flow
                </span>
            </div>
              
              <div className="hidden md:flex items-center space-x-6">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  onClick={() => document.getElementById('upload-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-sm font-medium text-white/80 hover:text-white transition-colors relative group cursor-pointer flex items-center gap-2"
                  title="Upload your video for processing"
                >
                  <Upload className="w-4 h-4" />
                  Upload
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  onClick={() => document.getElementById('transcription-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-sm font-medium text-white/80 hover:text-white transition-colors relative group cursor-pointer flex items-center gap-2"
                  title="Generate AI transcription with timestamps"
                >
                  <FileText className="w-4 h-4" />
                  Transcript
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  onClick={() => document.getElementById('search-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-sm font-medium text-white/80 hover:text-white transition-colors relative group cursor-pointer flex items-center gap-2"
                  title="Search through video content"
                >
                  <Search className="w-4 h-4" />
                  Search
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  onClick={() => document.getElementById('story-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-sm font-medium text-white/80 hover:text-white transition-colors relative group cursor-pointer flex items-center gap-2"
                  title="Generate AI-powered stories"
                >
                  <Sparkles className="w-4 h-4" />
                  Story
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  onClick={() => document.getElementById('render-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-sm font-medium text-white/80 hover:text-white transition-colors relative group cursor-pointer flex items-center gap-2"
                  title="Render final video with AI enhancements"
                >
                  <Video className="w-4 h-4" />
                  Render
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
                </motion.button>
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-white/80" />
                <span className="text-sm font-medium text-white/90">
                  Welcome, {user?.name || 'User'}
                </span>
            </div>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors"
                title="Logout from your account"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </motion.button>
          </div>
        </div>
        </div>
      </nav>

      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="pt-16 pb-4 text-center"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex justify-center"
          >
            <ChevronDown className="w-8 h-8 text-gray-400" />
          </motion.div>
            </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-10 pb-24 pt-8">
        <div className="space-y-16">
          
          {/* Video Upload Section */}
          <motion.div 
            id="upload-section"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-white/10 backdrop-blur-md rounded-xl shadow-xl border border-white/20 p-8"
          >
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-md"
                  title="Upload your video for transcription and AI analysis"
                >
                  <Upload className="w-5 h-5 text-white" />
                </motion.div>
              <div>
                  <h2 className="text-xl font-bold text-white mb-1">Video Upload</h2>
                  <p className="text-sm text-white/70">
                    Upload your video file to begin the AI-powered transcription and storytelling process
                  </p>
                </div>
              </div>
              </div>

            <div className="space-y-6">
              {/* Professional Upload Area */}
              <motion.div 
                whileHover={{ scale: 1.01 }}
                className="relative"
              >
                <label className="block">
                  <div className="border-2 border-dashed border-white/30 rounded-lg p-8 text-center hover:border-purple-400 hover:bg-white/5 transition-all duration-300 cursor-pointer group relative">
                    {preview ? (
                      <div className="w-full h-full">
                  <video 
                    ref={videoElementRef}
                    src={preview.url} 
                    controls 
                          className="w-full h-full rounded-lg shadow-md max-h-48 mx-auto" 
                  />
                        <div className="absolute top-2 right-2 bg-white/80 rounded-full p-1">
                          <Upload className="w-4 h-4 text-gray-600" />
                  </div>
                </div>
                    ) : (
                      <>
                        <Upload className="w-12 h-12 text-white/60 mx-auto mb-6 group-hover:text-purple-300 transition-colors" />
                        <div className="text-lg font-medium text-white mb-2">Drop your video here or click to browse</div>
                        <div className="text-sm text-white/70">Supports MP4, MOV, AVI and more (max 500MB)</div>
                      </>
                    )}
                  </div>
                  <input 
                    type="file" 
                    accept="video/*" 
                    onChange={handleFileSelect} 
                    className="hidden" 
                    disabled={isUploading} 
                  />
                </label>
              </motion.div>



              {/* Upload Progress */}
              {isUploading && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20 shadow-xl"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-white">Uploading video...</span>
                    <span className="text-sm text-white font-semibold">{uploadProgress}%</span>
            </div>
                  <div className="w-full bg-white/20 rounded-full h-3">
                    <motion.div 
                      className="bg-white h-3 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                </div>
                </motion.div>
              )}

              {/* Status Messages */}

              


              {/* Upload Button */}
              <div className="flex justify-center pt-4">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleUpload} 
                  disabled={!selectedFile || isUploading} 
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  {isUploading ? 'Uploading...' : 'Upload Video'}
                </motion.button>
                              </div>
                            </div>
          </motion.div>

          {/* Transcription Section */}
          <motion.div 
            id="transcription-section"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-white/10 backdrop-blur-md rounded-xl shadow-xl border border-white/20 p-8"
          >
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="w-8 h-8 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg flex items-center justify-center shadow-md"
                  title="Generate AI transcription with timestamps"
                >
                  <FileText className="w-5 h-5 text-white" />
                </motion.div>
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">AI Transcription</h2>
                  <p className="text-sm text-white/70">
                    Convert your video content into searchable text with precise timestamps
                  </p>
                          </div>
                             </div>
                           </div>
            
            <div className="space-y-6">
              {/* Transcription Display */}
              {transcription ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20 shadow-xl"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-white">Transcription Result</h3>
                    <div className="text-sm text-white/80 font-medium">
                      {transcription.split(' ').length} words
                        </div>
                    </div>
                  <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10 max-h-64 overflow-y-auto">
                    <p className="text-white whitespace-pre-wrap leading-relaxed">{transcription}</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white/10 rounded-xl p-8 text-center border-2 border-dashed border-white/20 backdrop-blur-sm shadow-lg"
                >
                  <FileText className="w-12 h-12 text-white/60 mx-auto mb-4" />
                  <p className="text-white text-base mb-2">No transcription available</p>
                  <p className="text-white/70 text-sm">Upload a video first to generate transcription</p>
                </motion.div>
              )}

              {/* Error Message */}
              {transcriptionError && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-500/20 backdrop-blur-md border border-red-400/30 rounded-xl p-6"
                >
                  <p className="text-red-200 text-sm font-medium">{transcriptionError}</p>
                </motion.div>
              )}

              {/* Generate Button */}
              <div className="flex justify-center pt-4">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleTranscribe} 
                  disabled={!videoId || isTranscribing} 
                  className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  {isTranscribing ? 'Transcribing...' : 'Generate Transcription'}
                </motion.button>
              </div>
            </div>
          </motion.div>



          {/* Search Section */}
          <motion.div 
            id="search-section"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-white/10 backdrop-blur-md rounded-xl shadow-xl border border-white/20 p-8"
          >
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="w-8 h-8 bg-gradient-to-r from-orange-600 to-red-600 rounded-lg flex items-center justify-center shadow-md"
                  title="Search through video content with timestamps"
                >
                  <Search className="w-5 h-5 text-white" />
                </motion.div>
              <div>
                  <h2 className="text-xl font-bold text-white mb-1">Search Video Content</h2>
                  <p className="text-sm text-white/70">
                    Find specific moments in your video using AI-powered search with precise timestamps
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              {/* Search Input */}
              <div className="max-w-2xl mx-auto">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Enter search terms to find specific moments..." 
                    className="w-full pl-12 pr-6 py-4 bg-white/10 border border-white/20 rounded-lg shadow-sm placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-base text-white"
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
              </div>

              {/* Search Button */}
              <div className="flex justify-center">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                    onClick={handleSearch}
                    disabled={!videoId || !searchQuery.trim() || isSearching}
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                  {isSearching ? 'Searching...' : 'Search Video'}
                </motion.button>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20 shadow-xl"
                >
                  <div className="flex items-center justify-between mb-6">
                                          <h3 className="text-lg font-semibold text-white">Search Results</h3>
                    <div className="text-sm text-white/80 font-medium">
                      {searchResults.length} matches found
                    </div>
                  </div>
                  <div className="space-y-4">
                    {searchResults.map((result, index) => (
                      <motion.div 
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => handleSearchResultClick(result)}
                        className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10 hover:shadow-md transition-all duration-300 cursor-pointer hover:scale-[1.02]"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                                result.match_type === 'word_match'
                                  ? 'bg-blue-100 text-blue-800'
                                  : result.match_type === 'sentence_match'
                                  ? 'bg-green-100 text-green-800'
                                  : result.type === 'transcript' 
                                    ? 'bg-purple-100 text-purple-800' 
                                    : 'bg-orange-100 text-orange-800'
                              }`}>
                                {result.match_type === 'word_match' ? 'Word Match' : 
                                 result.match_type === 'sentence_match' ? 'Sentence' : 
                                 result.type === 'transcript' ? 'Transcript' : 'Tag'}
                              </span>
                              <span className="text-xs text-orange-600 font-medium">
                                {formatTimestamp(result.start_time)} - {formatTimestamp(result.end_time)}
                              </span>
                              <span className="text-xs text-gray-500">
                                {(result.score * 100).toFixed(0)}% match
                              </span>
                            </div>
                            <div className="text-sm text-white font-medium leading-relaxed">
                              {result.preview_text}
                            </div>
                            {result.full_text && result.full_text !== result.preview_text && (
                              <div className="text-xs text-white/70 mt-2">
                                <strong>Full phrase:</strong> {result.full_text}
                              </div>
                            )}
                            {result.match_type === 'word_match' && result.matched_word && (
                              <div className="text-xs text-blue-300 mt-2">
                                <strong>Matched word:</strong> "{result.matched_word}" at {formatTimestamp(result.start_time)}s
                              </div>
                            )}
                          </div>
                                                      <motion.button 
                              whileHover={{ scale: 1.05 }}
                              onClick={() => handleSearchResultClick(result)}
                              className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors"
                              title={`Jump to ${formatTimestamp(result.start_time)}`}
                            >
                              Jump to Time
                            </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* No Results */}
              {searchResults.length === 0 && searchQuery && !isSearching && !searchError && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-gray-50 rounded-xl p-8 text-center border-2 border-dashed border-gray-300"
                >
                  <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No results found for "{searchQuery}"</p>
                </motion.div>
              )}

              {/* Jump Success Message */}
              {jumpMessage && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-green-500/20 backdrop-blur-md border border-green-400/30 rounded-xl p-6"
                >
                  <p className="text-green-200 text-sm font-medium">✅ {jumpMessage}</p>
                </motion.div>
              )}

              {/* Error Message */}
              {searchError && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-500/20 backdrop-blur-md border border-red-400/30 rounded-xl p-6"
                >
                  <p className="text-red-200 text-sm font-medium">{searchError}</p>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Story Generation Section */}
          <motion.div 
            id="story-section"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-white/10 backdrop-blur-md rounded-xl shadow-xl border border-white/20 p-8"
          >
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="w-8 h-8 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-md"
                  title="Generate AI-powered stories from your video content"
                >
                  <Sparkles className="w-5 h-5 text-white" />
                </motion.div>
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">AI Story Generation</h2>
                  <p className="text-sm text-white/70">
                    Transform your video into compelling stories with AI-powered scene generation and narration
                  </p>
                </div>
              </div>
                </div>
                
            <div className="space-y-6">
              {/* Story Input Controls */}
              <div className="max-w-4xl mx-auto">
                <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-white/90 mb-3">Story Mode</label>
                  <select 
                    value={storyMode} 
                    onChange={(e) => {
                      setStoryMode(e.target.value);
                      // Clear generated story when mode changes
                      setGeneratedStory(null);
                      console.log('Mode changed to:', e.target.value, '- Clearing generated story');
                    }}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-base text-white appearance-none"
                    >
                      <option value="normal" className="text-gray-900" style={{ color: '#111', backgroundColor: '#fff' }}>Normal</option>
                      <option value="positive" className="text-gray-900" style={{ color: '#111', backgroundColor: '#fff' }}>Positive</option>
                      <option value="negative" className="text-gray-900" style={{ color: '#111', backgroundColor: '#fff' }}>Negative</option>
                  </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-3">Story Prompt</label>
                    <textarea 
                      value={storyPrompt} 
                      onChange={(e) => setStoryPrompt(e.target.value)} 
                      placeholder="Enter a prompt for story generation (e.g., 'make a birthday highlight', 'create a travel vlog', 'show the best moments')" 
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg shadow-sm placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-base resize-none text-white" 
                      rows={4} 
                    />
                  </div>
                </div>
              </div>

              {/* Generate Button */}
              <div className="flex flex-col items-center pt-4 space-y-2">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    console.log('Button clicked - videoId:', videoId, 'storyPrompt:', storyPrompt, 'isGenerating:', isGenerating);
                    handleGenerateStory();
                  }} 
                  disabled={!videoId || !storyPrompt || isGenerating} 
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  {isGenerating ? 'Generating Story...' : 'Generate AI Story'}
                </motion.button>
                
                {/* Debug info */}
                {(!videoId || !storyPrompt || isGenerating) && (
                  <div className="text-xs text-white/60">
                    {!videoId && 'No video uploaded'}
                    {!storyPrompt && 'No story prompt'}
                    {isGenerating && 'Currently generating...'}
                  </div>
                )}
              </div>

              {/* Generated Story Display */}
              {generatedStory && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20 shadow-xl"
                >
                  {storyMode === 'contrast' ? (
                    // Contrast Mode Display
                    <div className="space-y-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-white">AI Generated Contrast Stories</h3>
                        <span className="text-sm text-white/70">Contrast Mode</span>
                      </div>
                      
                      {/* Positive Story */}
                      <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20 shadow-xl">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold">+</span>
                          </div>
                          <h4 className="text-lg font-semibold text-white">Positive Story</h4>
                          <span className="text-sm text-white/80">Story ID: {generatedStory.positiveStory?.storyId}</span>
                        </div>
                        
                        {/* Scene Jump Message */}
                        {sceneJumpMessage && (
                          <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-green-500/20 backdrop-blur-md border border-green-400/30 rounded-xl p-4 mb-4"
                          >
                            <p className="text-green-200 text-sm font-medium">{sceneJumpMessage}</p>
                          </motion.div>
                        )}
                        
                        {/* Positive Story Narrative */}
                        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10 mb-4">
                          <div className="prose prose-sm max-w-none">
                            <p className="text-white leading-relaxed">
                              {generatedStory.positiveStory?.scenes && generatedStory.positiveStory.scenes.map((scene, index) => (
                                <span key={index}>
                                  {scene.narration}
                                  {index < generatedStory.positiveStory.scenes.length - 1 && ' '}
                                </span>
                              ))}
                            </p>
                          </div>
                        </div>
                        
                        {/* Positive Scene Details */}
                        <div className="space-y-3">
                          <h5 className="text-md font-semibold text-white">Positive Scene Breakdown</h5>
                          {generatedStory.positiveStory?.scenes && generatedStory.positiveStory.scenes.map((scene, index) => (
                            <div key={index} className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10">
                              <div className="flex items-center justify-between mb-2">
                                <h6 className="font-medium text-white">Scene {index + 1}</h6>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-white/70">
                                    {formatTimestamp(scene.start)} - {formatTimestamp(scene.end)}
                                  </span>
                                  <button 
                                    onClick={() => handleSceneJump(scene.start)}
                                    className="text-white hover:text-white/80 text-sm font-medium"
                                  >
                                    Jump to Scene
                                  </button>
                                </div>
                              </div>
                              
                              <div className="space-y-3">
                                <div>
                                  <label className="text-sm font-medium text-white/90 flex items-center gap-2">
                                    <span className="text-lg">📝</span>
                                    Caption:
                                  </label>
                                  <div className="mt-2 p-3 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
                                    <p className="text-lg font-semibold text-white leading-relaxed">{scene.caption}</p>
                                  </div>
                                </div>
                                
                                <div>
                                  <label className="text-sm font-medium text-white/90 flex items-center gap-2">
                                    <span className="text-lg">🎙️</span>
                                    Narration:
                                  </label>
                                  <div className="mt-2 p-3 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
                                    <p className="text-sm text-white leading-relaxed italic">{scene.narration}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Negative Story */}
                      <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20 shadow-xl">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold">-</span>
                          </div>
                          <h4 className="text-lg font-semibold text-white">Negative Story</h4>
                          <span className="text-sm text-white/80">Story ID: {generatedStory.negativeStory?.storyId}</span>
                        </div>
                        
                        {/* Scene Jump Message */}
                        {sceneJumpMessage && (
                          <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-green-500/20 backdrop-blur-md border border-green-400/30 rounded-xl p-4 mb-4"
                          >
                            <p className="text-green-200 text-sm font-medium">{sceneJumpMessage}</p>
                          </motion.div>
                        )}
                        
                        {/* Negative Story Narrative */}
                        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10 mb-4">
                          <div className="prose prose-sm max-w-none">
                            <p className="text-white leading-relaxed">
                              {generatedStory.negativeStory?.scenes && generatedStory.negativeStory.scenes.map((scene, index) => (
                                <span key={index}>
                                  {scene.narration}
                                  {index < generatedStory.negativeStory.scenes.length - 1 && ' '}
                                </span>
                              ))}
                            </p>
                          </div>
                        </div>
                        
                        {/* Negative Scene Details */}
                        <div className="space-y-3">
                          <h5 className="text-md font-semibold text-white">Negative Scene Breakdown</h5>
                          {generatedStory.negativeStory?.scenes && generatedStory.negativeStory.scenes.map((scene, index) => (
                            <div key={index} className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10">
                              <div className="flex items-center justify-between mb-2">
                                <h6 className="font-medium text-white">Scene {index + 1}</h6>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-white/70">
                                    {formatTimestamp(scene.start)} - {formatTimestamp(scene.end)}
                                  </span>
                                  <button 
                                    onClick={() => handleSceneJump(scene.start)}
                                    className="text-white hover:text-white/80 text-sm font-medium"
                                  >
                                    Jump to Scene
                                  </button>
                                </div>
                              </div>
                              
                              <div className="space-y-3">
                                <div>
                                  <label className="text-sm font-medium text-white/90 flex items-center gap-2">
                                    <span className="text-lg">📝</span>
                                    Caption:
                                  </label>
                                  <div className="mt-2 p-3 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
                                    <p className="text-lg font-semibold text-white leading-relaxed">{scene.caption}</p>
                                  </div>
                                </div>
                                
                                <div>
                                  <label className="text-sm font-medium text-white/90 flex items-center gap-2">
                                    <span className="text-lg">🎙️</span>
                                    Narration:
                                  </label>
                                  <div className="mt-2 p-3 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
                                    <p className="text-sm text-white leading-relaxed italic">{scene.narration}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Single Story Display
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-white">AI Generated Story</h3>
                      </div>
                      
                      {/* Scene Jump Message */}
                      {sceneJumpMessage && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-green-500/20 backdrop-blur-md border border-green-400/30 rounded-xl p-4 mb-4"
                        >
                          <p className="text-green-200 text-sm font-medium">{sceneJumpMessage}</p>
                        </motion.div>
                      )}
                      
                      {/* Complete Story Narrative */}
                      <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20 mb-6 shadow-xl">
                        <div className="prose prose-sm max-w-none">
                          <p className="text-white leading-relaxed mb-4">
                            {generatedStory.scenes && generatedStory.scenes.map((scene, index) => (
                              <span key={index}>
                                {scene.narration}
                                {index < generatedStory.scenes.length - 1 && ' '}
                              </span>
                            ))}
                          </p>
                        </div>
                      </div>
                      
                      {/* Scene Details */}
                      <div className="space-y-4">
                        <h4 className="text-md font-semibold text-white">Scene Breakdown</h4>
                        {generatedStory.scenes && generatedStory.scenes.map((scene, index) => (
                          <div key={index} className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-medium text-white">Scene {index + 1}</h5>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-white/70">
                                  {formatTimestamp(scene.start)} - {formatTimestamp(scene.end)}
                                </span>
                                <button 
                                  onClick={() => handleSceneJump(scene.start)}
                                  className="text-white hover:text-white/80 text-sm font-medium"
                                >
                                  Jump to Scene
                                </button>
                              </div>
                            </div>
                            
                            <div className="space-y-3">
                              <div>
                                <label className="text-sm font-medium text-white/90 flex items-center gap-2">
                                  <span className="text-lg">📝</span>
                                  Caption:
                                </label>
                                <div className="mt-2 p-3 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
                                  <p className="text-lg font-semibold text-white leading-relaxed">{scene.caption}</p>
                                </div>
                              </div>
                              
                              <div>
                                <label className="text-sm font-medium text-white/90 flex items-center gap-2">
                                  <span className="text-lg">🎙️</span>
                                  Narration:
                                </label>
                                <div className="mt-2 p-3 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
                                  <p className="text-sm text-white leading-relaxed italic">{scene.narration}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Error Message */}
              {storyError && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-500/20 backdrop-blur-md border border-red-400/30 rounded-xl p-4"
                >
                  <p className="text-red-200 text-sm font-medium">{storyError}</p>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Video Rendering Section */}
          <motion.div 
            id="render-section"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-white/10 backdrop-blur-md rounded-xl shadow-xl border border-white/20 p-8"
          >
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="w-8 h-8 bg-gradient-to-r from-pink-600 to-rose-600 rounded-lg flex items-center justify-center shadow-md"
                  title="Render final video with AI enhancements and transitions"
                >
                  <Video className="w-5 h-5 text-white" />
                </motion.div>
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">Video Rendering</h2>
                  <p className="text-sm text-white/70">
                    Create your final cinematic video with AI-generated scenes, transitions, and professional effects
                  </p>
              </div>
            </div>
          </div>

            <div className="space-y-6">
              {/* Render Options */}
              <div className="max-w-2xl mx-auto">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 shadow-lg">
                  <label className="block text-sm font-medium text-white/90 mb-3">
                  Transition Duration (seconds)
                </label>
                <input
                  type="number"
                  min="0"
                  max="2"
                  step="0.1"
                  value={renderOptions.transitionDuration}
                  onChange={(e) => setRenderOptions({
                    ...renderOptions,
                    transitionDuration: parseFloat(e.target.value)
                  })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-base"
                />
                </div>
              </div>

              {/* Render Progress */}
              {isRendering && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20 shadow-xl"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-base font-medium text-white">🎬 Rendering Your Video...</span>
                    <span className="text-base text-white font-semibold">{renderProgress}%</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-3">
                    <motion.div 
                      className="bg-white h-3 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${renderProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <p className="text-sm text-white/80 mt-3 text-center">
                    Creating cinematic masterpiece with AI enhancements...
                  </p>
                </motion.div>
              )}

              {/* Rendered Video - Cinematic Display */}
              {renderedVideo && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20 shadow-xl"
                >
                  {renderedVideo.mode === 'contrast' ? (
                    // Contrast Mode - Side by Side Videos
                    <div className="space-y-6">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-base font-medium text-white">Contrast Videos Rendered Successfully!</h4>
                        <span className="text-sm text-white/80">Contrast Mode</span>
                      </div>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Positive Video */}
                        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold text-sm">+</span>
                            </div>
                            <h5 className="font-semibold text-white">Positive Story</h5>
                          </div>
                          
                          <video 
                            controls 
                            className="w-full rounded-xl mb-4 shadow-2xl aspect-video"
                            src={renderedVideo.positiveVideo?.videoUrl}
                            onError={(e) => {
                              console.error('Positive video error:', e);
                              alert('Error loading positive video: ' + e.target.error);
                            }}
                          >
                            Your browser does not support the video tag.
                          </video>
                          
                          <div className="flex gap-2">
                            <a
                              href={renderedVideo.positiveVideo?.videoUrl}
                              download={`positive_story_${renderedVideo.positiveVideo?.renderId}.mp4`}
                              className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Download Positive
                            </a>
                          </div>
                        </div>
                        
                        {/* Negative Video */}
                        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold text-sm">-</span>
                            </div>
                            <h5 className="font-semibold text-white">Negative Story</h5>
                          </div>
                          
                          <video 
                            controls 
                            className="w-full rounded-xl mb-4 shadow-2xl aspect-video"
                            src={renderedVideo.negativeVideo?.videoUrl}
                            onError={(e) => {
                              console.error('Negative video error:', e);
                              alert('Error loading negative video: ' + e.target.error);
                            }}
                          >
                            Your browser does not support the video tag.
                          </video>
                          
                          <div className="flex gap-2">
                            <a
                              href={renderedVideo.negativeVideo?.videoUrl}
                              download={`negative_story_${renderedVideo.negativeVideo?.renderId}.mp4`}
                              className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Download Negative
                            </a>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => {
                            setRenderedVideo(null);
                            setRenderProgress(0);
                          }}
                          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                        >
                          Render New Video
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Single Video Display
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-md font-medium text-white">Video Rendered Successfully!</h4>
                      </div>
                      
                      <video 
                        controls 
                        className="w-full rounded-xl shadow-2xl aspect-video"
                        src={renderedVideo.videoUrl}
                        onError={(e) => {
                          console.error('Video error:', e);
                          alert('Error loading video: ' + e.target.error);
                        }}
                        onLoadStart={() => console.log('Video loading started')}
                        onCanPlay={() => console.log('Video can play')}
                      >
                        Your browser does not support the video tag.
                      </video>
                      
                      <div className="flex gap-2">
                        <a
                          href={renderedVideo.videoUrl}
                          download={`story_${renderedVideo.renderId}.mp4`}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Download Video
                        </a>
                        <button
                          onClick={() => {
                            // Test if video URL is accessible
                            fetch(renderedVideo.videoUrl)
                              .then(response => {
                                if (response.ok) {
                                  alert('Video URL is accessible!');
                                } else {
                                  alert('Video URL is not accessible. Status: ' + response.status);
                                }
                              })
                              .catch(error => {
                                alert('Error accessing video URL: ' + error.message);
                              });
                          }}
                          className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
                        >
                          Test Video URL
                        </button>
                        <button
                          onClick={() => {
                            setRenderedVideo(null);
                            setRenderProgress(0);
                          }}
                          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                        >
                          Render New Video
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Render Error */}
              {renderError && (
                  <div className="p-3 bg-red-500/20 backdrop-blur-md border border-red-400/30 rounded-md">
                  <p className="text-red-200 text-sm">{renderError}</p>
                </div>
              )}

              {/* Render Button */}
              <div className="flex justify-center">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleRenderVideo} 
                  disabled={!generatedStory || !generatedStory.scenes || isRendering} 
                  className="px-12 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl text-lg"
                >
                  {isRendering ? '🎬 Rendering...' : '🎬 Render Video'}
                </motion.button>
              </div>
            </div>
          </motion.div>

        {/* Memory Engine Section */}
          <motion.div 
            id="memory-section"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-white/10 backdrop-blur-md rounded-xl shadow-xl border border-white/20 p-8"
          >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-base">🧠</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Memory Engine</h3>
              <p className="text-sm text-white/70">Intelligent video metadata storage</p>
            </div>
          </div>
          
          {/* Memory Access Button */}
          <div className="mb-4">
            {videoId && (
              <button
                onClick={() => {
                  setGlobalSearchQuery('');
                  setGlobalSearchResults([]);
                  handleShowCurrentVideo();
                }}
                disabled={isGlobalSearching}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:via-purple-600 hover:to-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                title="Retrieve current video from memory"
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg">🧠</span>
                  <span>Retrieve Current Video</span>
                  <span className="text-sm opacity-80">→</span>
                </div>
              </button>
            )}
          </div>

          {/* Current Video Memory Display */}
          {showCurrentVideo && currentVideoDetails && (
                            <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-xl border border-white/20 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                    <span className="text-white font-bold text-lg">🎥</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-bold text-base">{currentVideoDetails.filename}</h4>
                    <p className="text-white/80 text-sm font-mono">ID: {currentVideoDetails.videoId}</p>
                  </div>
                </div>
              </div>
              
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                  <div className="bg-white/5 backdrop-blur-sm p-3 rounded-lg border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-blue-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-xs">📍</span>
                      </div>
                      <span className="font-semibold text-white text-sm">Location</span>
                    </div>
                    <p className="text-xs text-white/80 font-mono break-all">
                      {currentVideoDetails.localPath ? currentVideoDetails.localPath.split('/').pop() : 'Local storage'}
                    </p>
                  </div>
                  
                  <div className="bg-white/5 backdrop-blur-sm p-3 rounded-lg border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-green-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-xs">📏</span>
                      </div>
                      <span className="font-semibold text-white text-sm">File Size</span>
                    </div>
                    <p className="text-xs text-white/80 font-mono">
                      {formatFileSize(currentVideoDetails.fileSize || 0)}
                    </p>
                  </div>
                  
                  <div className="bg-white/5 backdrop-blur-sm p-3 rounded-lg border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-purple-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-xs">⏱️</span>
                      </div>
                      <span className="font-semibold text-white text-sm">Duration</span>
                    </div>
                    <p className="text-xs text-white/80 font-mono">
                      {formatDuration(currentVideoDetails.duration || 0)}
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-3 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/70">Status:</span>
                    <span className="px-2 py-1 bg-white/10 text-white text-xs font-semibold rounded-full">
                      {currentVideoDetails.status}
                    </span>
                  </div>
                  <div className="text-xs text-white/70">
                    Created: {new Date(currentVideoDetails.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isGlobalSearching && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
              <p className="mt-4 text-white/80 font-medium">Retrieving from memory...</p>
            </div>
          )}

          {/* No Video in Memory */}
          {!isGlobalSearching && !globalSearchError && !showCurrentVideo && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🧠</span>
              </div>
              <h4 className="text-xl font-bold text-white mb-2">Memory Engine Ready</h4>
              <p className="text-white/80 mb-1">Upload a video to store it in memory</p>
              <p className="text-sm text-white/60">Intelligent metadata storage for quick access</p>
            </div>
          )}

          {/* Error State */}
          {globalSearchError && (
                          <div className="bg-red-500/20 backdrop-blur-md border border-red-400/30 rounded-xl p-4">
              <div className="flex items-center gap-2">
                <span className="text-red-300">⚠️</span>
                <p className="text-red-200 font-medium">{globalSearchError}</p>
              </div>
            </div>
          )}
          </motion.div>

          {/* AI Tagging Section */}
          <motion.div 
            id="tagging-section"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-white/10 backdrop-blur-md rounded-xl shadow-xl border border-white/20 p-8"
          >
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="w-8 h-8 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg flex items-center justify-center shadow-md"
                  title="AI-powered visual element detection"
                >
                  <span className="text-white text-base">🔍</span>
                </motion.div>
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">AI Tagging</h2>
                  <p className="text-sm text-white/70">AI automatically detects and tags people, objects, settings, and activities in your videos.</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Centered Analyze Video Button */}
              <div className="flex justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleGenerateTags}
                  disabled={!videoId || isTagging}
                  className="px-8 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-semibold hover:from-cyan-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  {isTagging ? '🔍 Analyzing...' : '🔍 Generate Tags'}
                </motion.button>
              </div>

              {/* Error Display */}
              {taggingError && (
                <div className="p-3 bg-red-500/20 backdrop-blur-md border border-red-400/30 rounded-md">
                  <p className="text-red-200 text-sm">{taggingError}</p>
                </div>
              )}

              {/* Tags Display */}
              {visibleTags.length > 0 && (
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 shadow-xl">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-white mb-2">Detected Visual Elements</h3>
                    <p className="text-sm text-white/70">AI-generated tags from your video content</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {visibleTags.map((t, idx) => {
                      const isText = (t.source === 'text');
                      const chipClass = isText
                        ? 'bg-gradient-to-r from-fuchsia-600/30 to-pink-600/30 border-pink-400/40'
                        : 'bg-gradient-to-r from-cyan-600/30 to-blue-600/30 border-blue-400/40';
                      return (
                        <span
                          key={idx}
                          className={`px-3 py-2 rounded-full text-xs font-semibold text-white ${chipClass}`}
                          title={`${t.source === 'text' ? 'Text' : 'Visual'} element • Confidence: ${(t.confidence ? (t.confidence*100).toFixed(0) : (t.score ? (t.score*100).toFixed(0) : '--'))}%`}
                        >
                          {t.tag}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* No Tags State */}
              {!isTagging && visibleTags.length === 0 && videoId && (
                <div className="bg-white/5 backdrop-blur-md rounded-xl p-8 border border-white/10 text-center">
                  <div className="text-4xl mb-3">🏷️</div>
                  <h3 className="text-lg font-semibold text-white mb-2">No Tags Generated Yet</h3>
                  <p className="text-sm text-white/70">Click "Generate Tags" to detect visual elements, objects, and scenes in your video</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Inspirational Storytelling Section */}
          <InspirationalStory videoId={videoId} />


          {/* Emotional Journey Section */}
          <motion.div 
            id="emotional-journey-section"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-white/10 backdrop-blur-md rounded-xl shadow-xl border border-white/20 p-8"
          >
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="w-8 h-8 bg-gradient-to-r from-amber-600 to-pink-600 rounded-lg flex items-center justify-center shadow-md"
                  title="Create contrasting stories showing good vs. bad choices"
                >
                  <span className="text-white text-base">📈</span>
                </motion.div>
                <div>
                              <h2 className="text-xl font-bold text-white mb-1">Content-Based Emotional Journey</h2>
            <p className="text-sm text-white/70">AI analyzes your video content to create emotional analysis and contrasting stories</p>
            <p className="text-xs text-white/50 mt-1">Uses your video's transcript, visual elements, and emotional patterns to generate authentic insights</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Optional Feature Note */}
              <div className="bg-amber-500/20 backdrop-blur-md border border-amber-400/30 rounded-lg p-3">
                <p className="text-amber-200 text-sm">
                  <span className="font-semibold">💡 Optional Feature:</span> This tool creates contrasting narrative paths to explore different outcomes and choices.
                </p>
              </div>
              
              {/* Emotional Analysis Section */}
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 shadow-xl">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h3 className="text-white font-semibold">Emotional Analysis</h3>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAnalyzeEmotions}
                    disabled={!videoId || isAnalyzingEmotions}
                    className="px-6 py-3 bg-gradient-to-r from-amber-600 to-pink-600 text-white rounded-xl font-semibold hover:from-amber-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    {isAnalyzingEmotions ? 'Analyzing...' : 'Analyze Emotional Patterns'}
                  </motion.button>
                </div>
                
                {emotionsError && (
                  <div className="mb-4 p-3 bg-red-500/20 border border-red-400/30 rounded-md">
                    <p className="text-red-200 text-sm">{emotionsError}</p>
                  </div>
                )}

                {emotionsChartData.length > 0 && (
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={emotionsChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.15)" />
                        <XAxis 
                          dataKey="time" 
                          stroke="#fff" 
                          tick={{ fill: '#fff', fontSize: 12 }}
                          label={{ value: 'Time (seconds)', position: 'insideBottom', offset: -5, fill: '#fff', fontSize: 12 }}
                        />
                        <YAxis 
                          domain={[0, 1]} 
                          stroke="#fff" 
                          tick={{ fill: '#fff', fontSize: 12 }}
                          label={{ value: 'Emotional Intensity', angle: -90, position: 'insideLeft', fill: '#fff', fontSize: 12 }}
                        />
                        
                        {/* Custom Tooltip */}
                        <Tooltip 
                          contentStyle={{ 
                            background: 'rgba(255,255,255,0.95)', 
                            borderRadius: 8,
                            border: 'none',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                          }}
                          labelStyle={{ 
                            color: '#333',
                            fontWeight: 'bold',
                            fontSize: '14px'
                          }}
                          formatter={(value, name) => {
                            // Clean up emotion names for tooltip
                            const cleanNames = {
                              'happy': 'Happy',
                              'sad': 'Sad', 
                              'angry': 'Angry',
                              'calm': 'Calm',
                              'excited': 'Excited',
                              'neutral': 'Neutral'
                            };
                            return [value, cleanNames[name] || name];
                          }}
                        />
                        
                        {/* Custom Legend */}
                        <Legend 
                          wrapperStyle={{ color: '#fff' }}
                          formatter={(value) => {
                            // Clean up emotion names for legend
                            const cleanNames = {
                              'happy': 'Happy',
                              'sad': 'Sad',
                              'angry': 'Angry', 
                              'calm': 'Calm',
                              'excited': 'Excited',
                              'neutral': 'Neutral'
                            };
                            return cleanNames[value] || value;
                          }}
                        />
                        
                        {/* Common emotions lines (colors from your palette) */}
                        <Line 
                          type="monotone" 
                          dataKey="happy" 
                          stroke="#22c55e" 
                          dot={{ fill: '#22c55e', strokeWidth: 2, r: 3 }}
                          activeDot={{ r: 5, stroke: '#22c55e', strokeWidth: 2 }}
                          strokeWidth={3} 
                          connectNulls={true}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="sad" 
                          stroke="#60a5fa" 
                          dot={{ fill: '#60a5fa', strokeWidth: 2, r: 3 }}
                          activeDot={{ r: 5, stroke: '#60a5fa', strokeWidth: 2 }}
                          strokeWidth={3} 
                          connectNulls={true}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="angry" 
                          stroke="#f97316" 
                          dot={{ fill: '#f97316', strokeWidth: 2, r: 3 }}
                          activeDot={{ r: 5, stroke: '#f97316', strokeWidth: 2 }}
                          strokeWidth={3} 
                          connectNulls={true}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="calm" 
                          stroke="#a78bfa" 
                          dot={{ fill: '#a78bfa', strokeWidth: 2, r: 3 }}
                          activeDot={{ r: 5, stroke: '#a78bfa', strokeWidth: 2 }}
                          strokeWidth={3} 
                          connectNulls={true}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="excited" 
                          stroke="#e879f9" 
                          dot={{ fill: '#e879f9', strokeWidth: 2, r: 3 }}
                          activeDot={{ r: 5, stroke: '#e879f9', strokeWidth: 2 }}
                          strokeWidth={3} 
                          connectNulls={true}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="neutral" 
                          stroke="#ffffff" 
                          dot={{ fill: '#ffffff', strokeWidth: 2, r: 3 }}
                          activeDot={{ r: 5, stroke: '#ffffff', strokeWidth: 2 }}
                          strokeDasharray="4 2" 
                          strokeWidth={2} 
                          connectNulls={true}
                        />
                                              </LineChart>
                      </ResponsiveContainer>
                      
                      {/* Chart Instructions */}
                      <div className="mt-4 text-center">
                        <p className="text-white/60 text-sm">
                          💡 Hover over the chart to see emotional values at specific time points
                        </p>
                      </div>
                    </div>
                  )}
                </div>



              {(goodSide.length > 0 || badSide.length > 0) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/20">
                    <h4 className="text-white font-semibold mb-3">Positive Path</h4>
                    <div className="flex flex-wrap gap-2">
                      {goodSide.map((g, idx) => (
                        <span key={`good-${idx}`} className="px-3 py-1 rounded-full text-sm bg-green-600/30 text-green-200 border border-green-400/40">
                          {g.label}: {g.score}
                        </span>
                      ))}
                      {goodSide.length === 0 && <span className="text-white/70 text-sm">No data</span>}
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/20">
                    <h4 className="text-white font-semibold mb-3">Negative Path</h4>
                    <div className="flex flex-wrap gap-2">
                      {badSide.map((b, idx) => (
                        <span key={`bad-${idx}`} className="px-3 py-1 rounded-full text-sm bg-red-600/30 text-red-200 border border-red-400/40">
                          {b.label}: {b.score}
                        </span>
                      ))}
                      {badSide.length === 0 && <span className="text-white/70 text-sm">No data</span>}
                    </div>
                  </div>
                </div>
              )}

              {/* Emotional Journey Story generator */}
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 shadow-xl">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h3 className="text-white font-semibold">Contrasting Story Paths</h3>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleGenerateEmotionalJourney}
                    disabled={isGeneratingJourney || !transcription}
                    className="px-4 py-2 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-lg font-medium hover:from-pink-700 hover:to-rose-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGeneratingJourney ? 'Analyzing Video...' : 'Create Content-Based Stories'}
                  </motion.button>
                </div>
                {emotionalJourneyError && (
                  <div className="mb-3 p-3 bg-red-500/20 border border-red-400/30 rounded-md text-red-200 text-sm">
                    {emotionalJourneyError}
                  </div>
                )}
                {emotionalJourneyText && (
                  <div className="prose prose-invert max-w-none">
                    <div className="whitespace-pre-wrap text-white/90 leading-relaxed space-y-4">
                      {emotionalJourneyText.split('\n\n').map((paragraph, index) => {
                        if (paragraph.trim()) {
                          // Check if it's a title (contains "Path" or "Journey")
                          if (paragraph.toLowerCase().includes('path') || paragraph.toLowerCase().includes('journey')) {
                            return (
                              <h4 key={index} className="text-lg font-semibold text-white mb-2 border-b border-white/20 pb-2">
                                {paragraph.trim()}
                              </h4>
                            );
                          }
                          // Regular paragraph
                          return (
                            <p key={index} className="text-white/90 leading-relaxed">
                              {paragraph.trim()}
                            </p>
                          );
                        }
                        return null;
                      })}
                    </div>
                  </div>
                )}
                                  {!emotionalJourneyText && !emotionalJourneyError && (
                    <p className="text-white/60 text-sm">Generate two contrasting story paths showing good vs. bad choices based on your video content.</p>
                  )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
