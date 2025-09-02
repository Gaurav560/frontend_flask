import axios from 'axios';

// Get backend URL with fallback
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://backend-footage-flow.onrender.com';

console.log('Backend URL:', BACKEND_URL);

// Create axios instance with optimized configuration
const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: false // Important: false to avoid CORS issues
});

// Request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    console.log('Request headers:', config.headers);
    return config;
  },
  (error) => {
    console.error('🚨 Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor with detailed error handling
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    console.error(`❌ API Error Details:`);
    console.error(`- Status: ${error.response?.status || 'No status'}`);
    console.error(`- Code: ${error.code || 'No code'}`);
    console.error(`- Message: ${error.message}`);
    console.error(`- URL: ${originalRequest?.url}`);
    console.error(`- Method: ${originalRequest?.method}`);
    
    // Handle specific CORS errors
    if (error.code === 'ERR_NETWORK') {
      console.error('🚨 CORS/Network Error - Backend may be down or CORS misconfigured');
      throw new Error('Cannot connect to server. Please check if the backend is running and CORS is configured.');
    }
    
    if (error.response?.status === 0) {
      console.error('🚨 CORS Error - Preflight request failed');
      throw new Error('CORS error. Backend is not accepting requests from this domain.');
    }
    
    if (error.response?.status === 408 || error.code === 'ECONNABORTED') {
      console.error('🚨 Timeout Error');
      throw new Error('Request timed out. Please try with a smaller file or check your connection.');
    }
    
    if (error.response?.status >= 500) {
      console.error('🚨 Server Error');
      throw new Error('Server error. The backend service may be experiencing issues.');
    }
    
    return Promise.reject(error);
  }
);

// Specialized functions for different request types

// Upload function with form data
export const uploadVideo = async (formData, onProgress) => {
  try {
    console.log('🚀 Starting video upload...');
    
    const response = await axios.post(`${BACKEND_URL}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 120000, // 2 minutes for uploads
      withCredentials: false,
      onUploadProgress: (progressEvent) => {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        if (onProgress) {
          onProgress(progressEvent);
        }
        console.log(`Upload progress: ${progress}%`);
      }
    });
    
    console.log('✅ Upload successful');
    return response;
    
  } catch (error) {
    console.error('❌ Upload failed:', error);
    
    if (error.code === 'ERR_NETWORK') {
      throw new Error('Network error. Cannot connect to server.');
    }
    
    if (error.response?.status === 413) {
      throw new Error('File too large. Please use a smaller video file.');
    }
    
    throw error;
  }
};

// Transcription function
export const transcribeVideo = async (videoId) => {
  try {
    console.log(`🎤 Starting transcription for video: ${videoId}`);
    
    const response = await api.post('/transcribe-direct-video', { videoId });
    
    console.log('✅ Transcription successful');
    return response.data;
    
  } catch (error) {
    console.error('❌ Transcription failed:', error);
    
    if (error.message.includes('timeout')) {
      throw new Error('Transcription timed out. Please try with a shorter video.');
    }
    
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    
    throw new Error('Transcription failed. Please try again.');
  }
};

// Story generation function
export const generateStory = async (videoId, prompt, mode = 'normal') => {
  try {
    console.log(`📖 Generating story for video: ${videoId}`);
    
    const response = await api.post('/generate-story', {
      videoId,
      prompt,
      mode
    });
    
    console.log('✅ Story generation successful');
    return response.data;
    
  } catch (error) {
    console.error('❌ Story generation failed:', error);
    throw error;
  }
};

// Render video function
export const renderVideo = async (videoId, scenes, options = {}) => {
  try {
    console.log(`🎬 Rendering video: ${videoId}`);
    
    const response = await api.post('/render-story', {
      videoId,
      scenes,
      transitionDuration: options.transitionDuration || 0.5
    });
    
    console.log('✅ Video render successful');
    return response.data;
    
  } catch (error) {
    console.error('❌ Video render failed:', error);
    throw error;
  }
};

// Search function
export const searchVideo = async (videoId, query) => {
  try {
    console.log(`🔍 Searching video: ${videoId} for: ${query}`);
    
    const response = await api.post('/search', {
      videoId,
      query
    });
    
    console.log('✅ Search successful');
    return response.data;
    
  } catch (error) {
    console.error('❌ Search failed:', error);
    throw error;
  }
};

// Test CORS function
export const testCORS = async () => {
  try {
    const response = await api.get('/cors-test');
    console.log('✅ CORS test passed');
    return response.data;
  } catch (error) {
    console.error('❌ CORS test failed:', error);
    throw error;
  }
};

// Health check function
export const healthCheck = async () => {
  try {
    const response = await api.get('/health');
    console.log('✅ Health check passed');
    return response.data;
  } catch (error) {
    console.error('❌ Health check failed:', error);
    throw error;
  }
};

export default api;