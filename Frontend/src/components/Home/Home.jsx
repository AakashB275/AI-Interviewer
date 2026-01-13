// Frontend/src/components/Home/Home.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Play, 
  Brain, 
  Clock, 
  TrendingUp, 
  Settings, 
  Users,
  Star,
  ArrowRight,
  Sparkles,
  Target,
  Lock
} from 'lucide-react';
import TrainAIDialog from '../ui/trainDataDialogBox';
import JobRoleDialog from '../ui/JobRoleDialog';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../ui/card.jsx';

function FeatureCard({ title, description, icon, gradient, delay, onClick, badge, disabled, disabledMessage, showLock }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const handleClick = () => {
    if (disabled && disabledMessage) {
      alert(disabledMessage);
      return;
    }
    if (onClick) {
      onClick();
    }
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl shadow-xl cursor-pointer transition-all duration-700 transform ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      } ${isHovered && !disabled ? 'scale-105 shadow-2xl' : 'hover:scale-102'} ${
        disabled ? 'opacity-60 cursor-not-allowed' : ''
      }`}
      onMouseEnter={() => !disabled && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <div className={`absolute inset-0 ${gradient} ${disabled ? 'opacity-50' : ''}`}></div>
      <div className="absolute inset-0 bg-white/5 transition-all duration-300"></div>
      
      {showLock && disabled && (
        <div className="absolute top-4 left-4 z-20">
          <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 shadow-sm">
            <Lock size={14} />
            Locked
          </div>
        </div>
      )}
      
      <div className="relative z-10 p-8 h-full flex flex-col justify-between min-h-[280px]">
        {badge && !disabled && (
          <div className="absolute top-4 right-4">
            <span className="bg-white/90 text-gray-800 px-3 py-1 rounded-full text-sm font-medium shadow-sm">
              {badge}
            </span>
          </div>
        )}
        
        <div className="flex items-center justify-center mb-6">
          <div className={`p-4 rounded-full bg-white/80 shadow-md transition-all duration-300 ${
            isHovered && !disabled ? 'bg-white scale-110 shadow-lg' : ''
          }`}>
            {icon}
          </div>
        </div>
        
        <div className="text-center text-gray-800">
          <h3 className="text-2xl font-bold mb-3 leading-tight">{title}</h3>
          <p className="text-gray-700 text-lg leading-relaxed">{description}</p>
          
          {!disabled && (
            <div className={`mt-6 inline-flex items-center space-x-2 text-gray-700 transition-all duration-300 ${
              isHovered ? 'text-gray-900 transform translate-x-1' : ''
            }`}>
              <span className="font-medium">Get Started</span>
              <ArrowRight size={18} className="transition-transform duration-300" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, colorClass }) {
  return (
    <div className="bg-white rounded-xl p-4 text-gray-800 border border-gray-200 shadow-sm">
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-lg ${colorClass || 'bg-gray-100'}`}>
          {icon}
        </div>
        <div>
          <p className="text-gray-600 text-sm">{label}</p>
          <p className="text-xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

function Home() {
  const [showStats, setShowStats] = useState(false);
  const [isTrainAIDialogOpen, setIsTrainAIDialogOpen] = useState(false);
  const [isJobRoleDialogOpen, setIsJobRoleDialogOpen] = useState(false);
  const [hasResume, setHasResume] = useState(false);
  const [documentId, setDocumentId] = useState(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const { isLoggedIn, login } = useAuth();
  const navigate = useNavigate();

  // Check resume status
  const checkResumeStatus = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/upload/status', {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setHasResume(data.hasUploadedData);
        setDocumentId(data.documentId || null);
        localStorage.setItem('resumeUploaded', data.hasUploadedData);
      }
    } catch (error) {
      console.error('Failed to check resume status:', error);
    }
  };

  // Check resume status when logged in
  useEffect(() => {
    if (isLoggedIn) {
      checkResumeStatus();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    const timer = setTimeout(() => setShowStats(true), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleStartInterview = () => {
    if (!isLoggedIn) {
      setIsLoginModalOpen(true);
      return;
    }
    if (!hasResume) {
      alert('Please upload your resume first to start an interview');
      setIsTrainAIDialogOpen(true);
      return;
    }
    // Show job role dialog if resume is uploaded
    setIsJobRoleDialogOpen(true);
  };

  const handleJobRoleConfirm = async (role) => {
    if (!documentId) {
      // If documentId is not available, try to fetch it again
      await checkResumeStatus();
      if (!documentId) {
        alert('Unable to find your resume. Please upload it again.');
        setIsJobRoleDialogOpen(false);
        return;
      }
    }

    // Navigate to interview page with role and documentId as URL params
    // Difficulty will be determined automatically by the backend based on resume
    navigate(`/interview?role=${encodeURIComponent(role)}&documentId=${documentId}`);
    setIsJobRoleDialogOpen(false);
  };

  const handleTrainAI = () => {
    if (!isLoggedIn) {
      setIsLoginModalOpen(true);
      return;
    }
    setIsTrainAIDialogOpen(true);
  };

  const handleTrainAIDialogClose = () => {
    setIsTrainAIDialogOpen(false);
    checkResumeStatus();
  };

  const handleViewAnalytics = () => {
    if (!isLoggedIn) {
      setIsLoginModalOpen(true);
      return;
    }
    navigate("/user/userid");
  };

  const handleRecentInterviews = () => {
    if (!isLoggedIn) {
      setIsLoginModalOpen(true);
      return;
    }
    alert("Recent interviews coming soon...");
  };

  const handleSettings = () => {
    if (!isLoggedIn) {
      setIsLoginModalOpen(true);
      return;
    }
    alert("Settings coming soon...");
  };

  const handleQuickTips = () => {
    if (!isLoggedIn) {
      setIsLoginModalOpen(true);
      return;
    }
    alert("Interview tips coming soon...");
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header Section */}
        <div className="relative overflow-hidden">
          <div className="relative z-10 max-w-7xl mx-auto px-6 py-16">
            <div className="text-center mb-16">
              <div className="inline-flex items-center space-x-2 bg-white rounded-full px-6 py-2 text-gray-700 mb-6 border border-gray-200 shadow-sm">
                <Sparkles size={18} className="text-yellow-500" />
                <span>AI-Powered Interview Platform</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                Master Your
                <span className="text-blue-600"> Interview</span>
              </h1>
              <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
                Practice with our advanced AI interviewer, get real-time feedback, and land your dream job with confidence.
              </p>

              {/* Upload Resume CTA */}
              {!hasResume && (
                <div className="flex justify-center mt-8">
                  <div className="inline-flex items-center space-x-4 bg-yellow-50 rounded-full px-6 py-3 text-gray-700 border border-yellow-200 shadow-sm">
                    <Brain size={18} className="text-yellow-600" />
                    <span className="font-medium">Upload your resume to unlock AI interviews</span>
                    <button
                      onClick={handleTrainAI}
                      className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition"
                    >
                      Upload Now
                    </button>
                  </div>
                </div>
              )}

              {hasResume && (
                <div className="flex justify-center mt-8">
                  <div className="inline-flex items-center space-x-4 bg-green-50 rounded-full px-6 py-3 text-gray-700 border border-green-200 shadow-sm">
                    <Star size={18} className="text-green-600" />
                    <span className="font-medium">Resume uploaded! You're ready to start interviewing</span>
                  </div>
                </div>
              )}
            </div>

            {/* Stats Section */}
            <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 transition-all duration-700 transform ${
              showStats ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
              <StatCard icon={<Users size={20} className="text-blue-600" />} label="Active Users" value="10,000+" colorClass="bg-blue-100" />
              <StatCard icon={<Target size={20} className="text-green-600" />} label="Success Rate" value="94%" colorClass="bg-green-100" />
              <StatCard icon={<Star size={20} className="text-yellow-600" />} label="Avg Rating" value="4.9/5" colorClass="bg-yellow-100" />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 pb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              title="Start Interview"
              description="Begin your AI-powered interview session with personalized questions and real-time feedback"
              icon={<Play size={32} className="text-blue-600" />}
              gradient="bg-blue-100"
              delay={200}
              onClick={handleStartInterview}
              disabled={!hasResume}
              disabledMessage="Please upload your resume first to unlock AI interviews"
              showLock={!hasResume}
            />
            
            <FeatureCard
              title="Upload Your Resume"
              description="Customize and improve your AI interviewer with specific job roles and requirements"
              icon={<Brain size={32} className="text-purple-600" />}
              gradient="bg-purple-100"
              delay={400}
              onClick={handleTrainAI}
              badge={!hasResume ? "Start Here" : "Update"}
              disabled={!isLoggedIn}
              disabledMessage="Please login first to upload your resume"
              showLock={!isLoggedIn}
            />
            
            <FeatureCard
              title="View Analytics"
              description="Track your progress with detailed performance metrics and improvement suggestions"
              icon={<TrendingUp size={32} className="text-teal-600" />}
              gradient="bg-teal-100"
              delay={600}
              onClick={handleViewAnalytics}
              badge="Popular"
              disabled={!isLoggedIn}
              disabledMessage="Please login first to view your analytics"
              showLock={!isLoggedIn}
            />
            
            <FeatureCard
              title="Recent Sessions"
              description="Review your past interview performances and see how you've improved over time"
              icon={<Clock size={32} className="text-orange-600" />}
              gradient="bg-orange-100"
              delay={800}
              onClick={handleRecentInterviews}
              disabled={!isLoggedIn}
              disabledMessage="Please login first to view recent sessions"
              showLock={!isLoggedIn}
            />
            
            <FeatureCard
              title="Quick Settings"
              description="Personalize your interview experience with custom preferences and configurations"
              icon={<Settings size={32} className="text-yellow-600" />}
              gradient="bg-yellow-100"
              delay={1000}
              onClick={handleSettings}
              disabled={!isLoggedIn}
              disabledMessage="Please login first to access settings"
              showLock={!isLoggedIn}
            />
            
            <FeatureCard
              title="Interview Tips"
              description="Access expert advice and proven strategies to excel in your next interview"
              icon={<Sparkles size={32} className="text-pink-600" />}
              gradient="bg-pink-100"
              delay={1200}
              onClick={handleQuickTips}
              badge="New"
            />
          </div>
        </div>
      </div>

      {/* Train AI Dialog */}
      <TrainAIDialog 
        isOpen={isTrainAIDialogOpen} 
        onClose={handleTrainAIDialogClose}
      />

      {/* Job Role Dialog */}
      <JobRoleDialog
        isOpen={isJobRoleDialogOpen}
        onClose={() => setIsJobRoleDialogOpen(false)}
        onConfirm={handleJobRoleConfirm}
      />

      {/* Login Modal */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-96 bg-slate-800/95 backdrop-blur-sm border border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Login Required</CardTitle>
              <CardDescription className="text-gray-300">Please login to access this feature</CardDescription>
            </CardHeader>
            <CardContent>
              <input
                id="username-input"
                type="text"
                placeholder="Username"
                className="w-full border border-white/20 bg-slate-700/50 text-white placeholder-gray-400 px-3 py-2 rounded mb-3 focus:border-blue-400 focus:outline-none"
              />
              <input
                id="password-input"
                type="password"
                placeholder="Password"
                className="w-full border border-white/20 bg-slate-700/50 text-white placeholder-gray-400 px-3 py-2 rounded focus:border-blue-400 focus:outline-none"
              />
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <button
                className="px-4 py-1 rounded bg-slate-600 text-white hover:bg-slate-500 transition"
                onClick={() => setIsLoginModalOpen(false)}
              >
                Cancel
              </button>
              <button 
                className="px-4 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 transition"
                onClick={async () => {
                  const username = document.getElementById('username-input')?.value;
                  const password = document.getElementById('password-input')?.value;
                  
                  if (!username || !password) {
                    alert('Please enter username and password');
                    return;
                  }

                  try {
                    const response = await fetch('/api/auth/login', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ userName: username, password }),
                      credentials: 'include'
                    });

                    if (response.ok) {
                      const data = await response.json();
                      if (data.token) {
                        login(data.token, data.user);
                      }
                      setIsLoginModalOpen(false);
                      document.getElementById('username-input').value = '';
                      document.getElementById('password-input').value = '';
                    } else {
                      alert('Login failed. Please check your credentials.');
                    }
                  } catch (error) {
                    console.error('Login error:', error);
                    alert('An error occurred during login.');
                  }
                }}
              >
                Login
              </button>
            </CardFooter>
          </Card>
        </div>
      )}
    </>
  );
}

export default Home;