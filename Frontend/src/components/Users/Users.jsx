import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Phone, 
  FileText, 
  TrendingUp, 
  BarChart3, 
  Award, 
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  Activity,
  Target,
  Zap,
  Trash2,
  File,
  AlertCircle
} from 'lucide-react';

function Users() {
  const { user, setUser } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resumeStatus, setResumeStatus] = useState({
    hasUploadedData: false,
    fileCount: 0,
    lastUpdated: null,
    dataType: null,
    documentId: null,
    uploadedFiles: []
  });
  const [deletingFile, setDeletingFile] = useState(null);
  const location = useLocation();
  const [recentAnalytics, setRecentAnalytics] = useState(null);

  useEffect(() => {
    fetchUserData();
    fetchResumeStatus();
    fetchAnalytics();
    // If navigated with recent analytics payload, use it to display session details immediately
    if (location?.state?.recentAnalytics) {
      setRecentAnalytics(location.state.recentAnalytics);
    }
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          setUser(data.user);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchResumeStatus = async () => {
    try {
      const response = await fetch('/api/upload/status', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Sort files by upload date (newest first)
          const sortedFiles = (data.uploadedFiles || []).sort((a, b) => {
            const dateA = new Date(a.uploadDate || 0);
            const dateB = new Date(b.uploadDate || 0);
            return dateB - dateA;
          });

          setResumeStatus({
            hasUploadedData: data.hasUploadedData || false,
            fileCount: data.fileCount || 0,
            lastUpdated: data.lastUpdated || null,
            dataType: data.dataType || null,
            documentId: data.documentId || null,
            uploadedFiles: sortedFiles
          });
        }
      }
    } catch (error) {
      console.error('Error fetching resume status:', error);
    }
  };

  const handleDeleteFile = async (filename) => {
    if (!window.confirm('Are you sure you want to delete this resume? This action cannot be undone.')) {
      return;
    }

    setDeletingFile(filename);
    try {
      const response = await fetch(`/api/upload/file/${filename}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Refresh resume status after deletion
          await fetchResumeStatus();
          alert('Resume deleted successfully. The AI interviewer will now use your latest uploaded resume.');
        } else {
          alert(data.error || 'Failed to delete resume');
        }
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete resume');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('An error occurred while deleting the resume');
    } finally {
      setDeletingFile(null);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimetype) => {
    if (mimetype?.includes('pdf')) return <File className="text-red-500" size={18} />;
    if (mimetype?.includes('word') || mimetype?.includes('document')) return <FileText className="text-blue-500" size={18} />;
    if (mimetype?.includes('text')) return <FileText className="text-gray-500" size={18} />;
    return <File className="text-gray-500" size={18} />;
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/analytics/me', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAnalytics(data);
          if (data.recentSession) {
            setRecentAnalytics(data.recentSession);
          }
        } else {
          setError(data.error || 'Failed to load analytics');
        }
      } else {
        setError('Failed to load analytics');
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatMetric = (value) => {
    if (typeof value === 'number') {
      return value.toFixed(1);
    }
    return value || 'N/A';
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getRecentEvalFields = (evalObj) => {
    if (!evalObj) return { skillBreakdown: {}, suggestions: [] };
    const skillBreakdown = evalObj.skillBreakdown || evalObj.scores || {};
    const suggestions = evalObj.suggestions && evalObj.suggestions.length ? evalObj.suggestions : (evalObj.comments ? [evalObj.comments] : (evalObj.feedback ? (Array.isArray(evalObj.feedback) ? evalObj.feedback : [evalObj.feedback]) : []));
    return { skillBreakdown, suggestions };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* User Profile Section */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 h-32"></div>
          
          <div className="px-6 pb-8 -mt-16">
            {/* Avatar */}
            <div className="flex items-end gap-6 mb-6">
              <div className="mt-10 w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg border-4 border-white">
                {getInitials(user?.userName || 'User')}
              </div>
              
              <div className="flex-1 pb-2">
                <h1 className="text-3xl font-bold text-gray-900 mb-5">
                  {user?.userName || 'User'}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-gray-600">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">{user?.email || 'No email'}</span>
                  </div>
                  {user?.contact && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <span className="text-sm">{user.contact}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex place-items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Resume Status</p>
                    <div className="flex items-center gap-2 mt-1">
                      {resumeStatus.hasUploadedData ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-600">Uploaded</span>
                          {resumeStatus.fileCount > 0 && (
                            <span className="text-xs text-gray-500">({resumeStatus.fileCount} file{resumeStatus.fileCount !== 1 ? 's' : ''})</span>
                          )}
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-red-600" />
                          <span className="text-sm font-medium text-red-600">Not Uploaded</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* {resumeStatus.dataType && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Target className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Data Type</p>
                      <p className="text-sm font-medium text-gray-900 capitalize mt-1">
                        {resumeStatus.dataType.replace('-', ' ')}
                      </p>
                    </div>
                  </div>
                </div>
              )} */}

              {resumeStatus.lastUpdated && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Calendar className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Last Updated</p>
                      <p className="text-sm font-medium text-gray-900 mt-1">
                        {new Date(resumeStatus.lastUpdated).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Uploaded Resumes List */}
            {resumeStatus.hasUploadedData && resumeStatus.uploadedFiles.length > 0 && (
              <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Uploaded Resumes
                  </h3>
                  <span className="text-sm text-gray-500">
                    {resumeStatus.uploadedFiles.length} file{resumeStatus.uploadedFiles.length !== 1 ? 's' : ''}
                  </span>
                </div>
                
                <div className="space-y-3">
                  {resumeStatus.uploadedFiles.map((file, index) => (
                    <div
                      key={file.filename}
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        index === 0 
                          ? 'bg-blue-50 border-blue-200' 
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {getFileIcon(file.mimetype)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {file.originalName}
                            </p>
                            {index === 0 && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                                Latest
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            <span>{formatFileSize(file.size)}</span>
                            <span>•</span>
                            <span>
                              {file.uploadDate 
                                ? new Date(file.uploadDate).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })
                                : 'Unknown date'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteFile(file.filename)}
                        disabled={deletingFile === file.filename}
                        className={`ml-4 p-2 rounded-lg transition-colors ${
                          deletingFile === file.filename
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-red-50 text-red-600 hover:bg-red-100'
                        }`}
                        title="Delete this resume"
                      >
                        {deletingFile === file.filename ? (
                          <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-blue-800">
                      <strong>Note:</strong> The AI interviewer uses only your <strong>latest uploaded resume</strong> to generate questions. 
                      You can delete older resumes to ensure only the most current version is considered.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Analytics Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Analytics & Performance</h2>
          </div>

              {/* Admin link */}
              <div className="flex items-center justify-end">
                <a href="/admin" className="text-sm text-blue-600 hover:underline">Admin Dashboard</a>
              </div>

          {loading ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading analytics...</p>
            </div>
          ) : error ? (
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-gray-600">{error}</p>
              <button
                onClick={fetchAnalytics}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              {/* Key Metrics Cards */}
              {/* Recent Session Details (from just-completed interview) */}
              {recentAnalytics && (
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Session</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Role</p>
                      <p className="font-medium text-gray-900">{recentAnalytics.jobRole}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Difficulty</p>
                      <p className="font-medium text-gray-900 capitalize">{recentAnalytics.difficulty}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Duration</p>
                      <p className="font-medium text-gray-900">{recentAnalytics.durationSeconds || 0}s</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Session ID</p>
                      <p className="font-medium text-gray-900 truncate">{recentAnalytics.sessionId}</p>
                    </div>
                  </div>

                  {/* Skill breakdown */}
                  {(() => {
                    const { skillBreakdown} = getRecentEvalFields(recentAnalytics.evaluation);
                    const keys = Object.keys(skillBreakdown || {});
                    return (
                      <>
                        {keys.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Skill Breakdown</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {keys.map((skill) => {
                                const raw = skillBreakdown[skill];
                                const numeric = Number(raw) || 0;
                                const display = numeric > 10 ? numeric : numeric * 10; // normalize 0-10 -> 0-100
                                return (
                                  <div key={skill} className="border border-gray-200 rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="text-sm font-medium text-gray-700 capitalize">{skill.replace(/([A-Z])/g, ' $1').trim()}</div>
                                      <div className="text-sm font-semibold text-gray-900">{display.toFixed(1)}%</div>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                      <div className={`h-2.5 rounded-full ${display >= 80 ? 'bg-green-500' : display >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${Math.min(display, 100)}%` }} />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Suggestions / Feedback */}
                        {/* <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Suggestions & Feedback</h4>
                          <div className="space-y-2">
                            {suggestions && suggestions.length > 0 ? (
                              suggestions.map((s, i) => (
                                <div key={i} className="p-3 bg-yellow-50 border border-yellow-100 rounded-lg text-sm text-yellow-800">{s}</div>
                              ))
                            ) : (
                              <div className="text-sm text-gray-600">No suggestions provided.</div>
                            )}
                          </div>
                        </div> */}
                      </>
                    );
                  })()}

                  {/* Conversation History */}
                  {/* {recentAnalytics.conversationHistory && recentAnalytics.conversationHistory.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Conversation History</h4>
                      <div className="max-h-48 overflow-y-auto space-y-2">
                        {recentAnalytics.conversationHistory.map((m, idx) => (
                          <div key={idx} className={`p-2 rounded-lg ${m.role === 'interviewer' ? 'bg-blue-50 border-l-4 border-blue-500' : 'bg-green-50 border-l-4 border-green-500'}`}>
                            <p className="text-xs text-gray-500">{m.role === 'interviewer' ? 'Interviewer' : 'You'}</p>
                            <p className="text-sm text-gray-800">{m.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )} */}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Interviews */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Activity className="w-6 h-6 text-blue-600" />
                    </div>
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-600 mb-1">Total Interviews</h3>
                  <p className="text-3xl font-bold text-gray-900">
                    {analytics?.sessionCount || 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">All time sessions</p>
                </div>

                {/* Evaluations Count */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <Award className="w-6 h-6 text-purple-600" />
                    </div>
                    <Zap className="w-5 h-5 text-yellow-500" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-600 mb-1">Evaluations</h3>
                  <p className="text-3xl font-bold text-gray-900">
                    {analytics?.aggregates?.count || 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">Completed assessments</p>
                </div>

                {/* Average Score */}
                {analytics?.aggregates?.averages && Object.keys(analytics.aggregates.averages).length > 0 && (
                  <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-green-100 rounded-lg">
                        <Target className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                    <h3 className="text-sm font-medium text-gray-600 mb-1">Avg. Score</h3>
                    {(() => {
                      const scores = Object.values(analytics.aggregates.averages);
                      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
                      return (
                        <>
                          <p className={`text-3xl font-bold ${getScoreColor(avgScore)}`}>
                            {formatMetric(avgScore)}%
                          </p>
                          <p className="text-xs text-gray-500 mt-2">Overall performance</p>
                        </>
                      );
                    })()}
                  </div>
                )}

                {/* Recent Activity */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-orange-100 rounded-lg">
                      <Clock className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                  <h3 className="text-sm font-medium text-gray-600 mb-1">Activity</h3>
                  <p className="text-3xl font-bold text-gray-900">
                    {analytics?.sessionCount > 0 ? 'Active' : 'New'}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">Account status</p>
                </div>
              </div>

              {/* Detailed Metrics */}
              {analytics?.aggregates?.averages && Object.keys(analytics.aggregates.averages).length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    Performance Metrics
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.entries(analytics.aggregates.averages).map(([metric, value]) => {
                      const score = typeof value === 'number' ? value : parseFloat(value) || 0;
                      return (
                        <div key={metric} className="border border-gray-200 rounded-lg p-5 hover:border-blue-300 transition">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-medium text-gray-700 capitalize">
                              {metric.replace(/([A-Z])/g, ' $1').trim()}
                            </h4>
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreBgColor(score)} ${getScoreColor(score)}`}>
                              {formatMetric(score)}%
                            </div>
                          </div>
                          
                          {/* Progress Bar */}
                          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                            <div
                              className={`h-2.5 rounded-full transition-all ${
                                score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(score, 100)}%` }}
                            ></div>
                          </div>
                          
                          <p className="text-xs text-gray-500">
                            {score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : 'Needs Improvement'}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {(!analytics || analytics.sessionCount === 0) && (
                <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Data Yet</h3>
                  <p className="text-gray-600 mb-6">
                    Start your first interview to see your analytics and performance metrics here.
                  </p>
                  <a
                    href="/interview"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                  >
                    <Zap className="w-5 h-5" />
                    Start Interview
                  </a>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Users;
