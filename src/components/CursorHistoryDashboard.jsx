import React, { useState, useEffect } from 'react';

const CursorHistoryDashboard = () => {
  const [historyData, setHistoryData] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState('2025-08-18');
  const [userId, setUserId] = useState('test_user');

  const fetchHistoryData = async (date) => {
    setLoading(true);
    try {
      const response = await fetch(`http://footage-flow-env.eba-92jebm7b.ap-south-1.elasticbeanstalk.com/api/cursor/history/${userId}/${date}`);
      const data = await response.json();
      if (data.success) {
        setHistoryData(data.history);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    }
    setLoading(false);
  };

  const fetchAnalytics = async (date) => {
    try {
      const response = await fetch(`http://footage-flow-env.eba-92jebm7b.ap-south-1.elasticbeanstalk.com/api/cursor/analytics/${userId}/${date}`);
      const data = await response.json();
      if (data.success) {
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  useEffect(() => {
    fetchHistoryData(selectedDate);
    fetchAnalytics(selectedDate);
  }, [selectedDate, userId]);

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const handleUserIdChange = (e) => {
    setUserId(e.target.value);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">🎯 Cursor History Dashboard</h1>
        
        {/* Controls */}
        <div className="flex gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              User ID
            </label>
            <input
              type="text"
              value={userId}
              onChange={handleUserIdChange}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800">Total Events</h3>
            <p className="text-2xl font-bold text-blue-600">{analytics.total_events || 0}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-green-800">Videos Watched</h3>
            <p className="text-2xl font-bold text-green-600">{analytics.videos_watched || 0}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-purple-800">Watch Time</h3>
            <p className="text-2xl font-bold text-purple-600">{analytics.total_watch_time || 0}s</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-orange-800">Avg Session</h3>
            <p className="text-2xl font-bold text-orange-600">
              {analytics.average_session_length ? analytics.average_session_length.toFixed(1) : 0}s
            </p>
          </div>
        </div>

        {/* History Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Cursor History Events</h2>
          </div>
          
          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading history data...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Video ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Position
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Metadata
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {historyData.map((event, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(event.created_at).toLocaleTimeString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {event.video_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          event.action_type === 'seek' ? 'bg-blue-100 text-blue-800' :
                          event.action_type === 'pause' ? 'bg-yellow-100 text-yellow-800' :
                          event.action_type === 'play' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {event.action_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {event.cursor_position}s
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {event.metadata ? (
                          <div className="text-xs">
                            {event.metadata.session && <div>Session: {event.metadata.session}</div>}
                            {event.metadata.date && <div>Date: {event.metadata.date}</div>}
                          </div>
                        ) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {historyData.length === 0 && (
                <div className="p-6 text-center text-gray-500">
                  No cursor history data found for this date.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CursorHistoryDashboard;
