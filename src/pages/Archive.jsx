import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { VITE_BACKEND_URL } from '../googleConfig.js';

const Archive = () => {
  const [videos, setVideos] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');

  // Load all videos on component mount
  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await axios.get(`${VITE_BACKEND_URL}/videos`);
      
      if (response.data.success) {
        setVideos(response.data.videos);
      } else {
        setError('Failed to load videos');
      }
    } catch (err) {
      console.error('Error loading videos:', err);
      setError('Failed to load videos. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGlobalSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setError('');
    
    try {
      const response = await axios.post(`${VITE_BACKEND_URL}/global-search`, {
        query: searchQuery.trim()
      });
      
      if (response.data.success) {
        setSearchResults(response.data.results);
      } else {
        setError('Search failed');
      }
    } catch (err) {
      console.error('Error searching videos:', err);
      setError('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
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
    if (!seconds) return 'Unknown';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const displayVideos = searchQuery.trim() ? searchResults : videos;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Video Archive</h1>
          <p className="text-gray-600">
            Search and browse all your uploaded videos with transcripts and tags.
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search across all videos by transcript, tags, or filename..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleGlobalSearch()}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleGlobalSearch}
              disabled={isSearching}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
            {searchQuery.trim() && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Results Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              {searchQuery.trim() ? 'Search Results' : 'All Videos'}
            </h2>
            <div className="text-sm text-gray-500">
              {displayVideos.length} video{displayVideos.length !== 1 ? 's' : ''}
            </div>
          </div>
          {searchQuery.trim() && searchResults.length > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              Showing results for "{searchQuery}"
            </p>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading videos...</span>
          </div>
        )}

        {/* Videos Grid */}
        {!isLoading && displayVideos.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📹</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery.trim() ? 'No videos found' : 'No videos uploaded yet'}
            </h3>
            <p className="text-gray-600">
              {searchQuery.trim() 
                ? 'Try adjusting your search terms or browse all videos.'
                : 'Upload your first video to get started.'
              }
            </p>
          </div>
        )}

        {!isLoading && displayVideos.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayVideos.map((video) => (
              <div
                key={video.videoId}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200"
              >
                {/* Video Info */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 truncate flex-1">
                      {video.filename}
                    </h3>
                    {video.relevance_score && (
                      <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        Score: {video.relevance_score}
                      </span>
                    )}
                  </div>

                  {/* Video Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Duration:</span>
                      <span>{formatDuration(video.duration)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Size:</span>
                      <span>{formatFileSize(video.fileSize)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Uploaded:</span>
                      <span>{formatDate(video.createdAt)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        video.status === 'uploaded' ? 'bg-green-100 text-green-800' :
                        video.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {video.status}
                      </span>
                    </div>
                  </div>

                  {/* Transcript Preview */}
                  {video.transcript_preview && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Transcript Preview:</h4>
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {video.transcript_preview}
                      </p>
                    </div>
                  )}

                  {/* Visual Tags */}
                  {video.visual_tags && video.visual_tags.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Tags:</h4>
                      <div className="flex flex-wrap gap-1">
                        {video.visual_tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Story Count */}
                  {video.story_count > 0 && (
                    <div className="mb-4">
                      <span className="text-sm text-gray-600">
                        📖 {video.story_count} story{video.story_count !== 1 ? 's' : ''} generated
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => window.location.href = `/dashboard?videoId=${video.videoId}`}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Open in Dashboard
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Archive;
