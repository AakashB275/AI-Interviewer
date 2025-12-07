import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  AlertTriangle
} from 'lucide-react';
import TrainAIDialog from '../ui/trainDataDialogBox';

function FeatureCard({ title, description, icon, gradient, delay, onClick, badge, disabled, disabledMessage }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const handleClick = () => {
    if (disabled) {
      alert(disabledMessage || 'This feature is currently unavailable');
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
      
      {/* Subtle overlay for depth */}
      <div className="absolute inset-0 bg-white/5 transition-all duration-300"></div>
      
      
      
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
  const [trainingStatus, setTrainingStatus] = useState({
    hasUploadedData: false,
    fileCount: 0,
    lastUpdated: null
  });

  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setShowStats(true), 800);
    return () => clearTimeout(timer);
  }, []);


  useEffect(() => {
    fetchTrainingStatus();
  }, []);

  const fetchTrainingStatus = async () => {
    try {
      const response = await fetch('/api/upload/status', {
        credentials: 'include'
      });
      
      // Check if response is OK and content type is JSON
      if (!response.ok) {
        console.warn('Training status endpoint returned non-OK status:', response.status);
        return;
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('Training status endpoint returned non-JSON response');
        return;
      }
      
      const data = await response.json();
      
      if (data.success) {
        setTrainingStatus(data);
      }
    } catch (error) {
      // Silently handle errors - API might not be available
      console.warn('Training status not available:', error.message);
    }
  };

  const handleStartInterview = () => {
    navigate('/interview');
  };

  const handleTrainAI = () => {
    console.log('Opening AI training...');
    setIsTrainAIDialogOpen(true);
  };

  const handleTrainAIDialogClose = () => {
    setIsTrainAIDialogOpen(false);
    // Refresh training status after dialog closes
    fetchTrainingStatus();
  };

  const handleViewAnalytics = () => {
    if (!trainingStatus.hasUploadedData) {
      alert('Please upload your training data first to view personalized analytics.');
      return;
    }
    console.log('Opening analytics...');
    navigate("/user/userid");
  };

  const handleRecentInterviews = () => {
    console.log('Opening recent interviews...');
    alert("Coming soon...");
  };

  const handleSettings = () => {
    console.log('Opening settings...');
    alert("Settings coming soon...");
  };

  const handleQuickTips = () => {
    console.log('Opening tips...');
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

              {/* Training Status Display */}
              <div className="flex justify-center mt-8">
                {trainingStatus.hasUploadedData ? (
                  <div className="inline-flex items-center space-x-2 bg-green-50 rounded-full px-6 py-3 text-green-700 border border-green-200">
                    <Brain size={18} />
                    <span>AI Training Complete • {trainingStatus.fileCount} files uploaded</span>
                  </div>
                ) : (
                  <div >
                    {/* <AlertTriangle size={18} /> */}
                    {/* <span>Upload training data to unlock personalized interviews</span> */}
                  </div>
                )}
              </div>
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
            />
            
            <FeatureCard
              title="Upload your Resume"
              description="Customize and improve your AI interviewer with specific job roles and requirements"
              icon={<Brain size={32} className="text-purple-600" />}
              gradient="bg-purple-100"
              delay={400}
              onClick={handleTrainAI}
              badge={trainingStatus.hasUploadedData ? "Ready" : "Start Here"}
            />
            
            <FeatureCard
              title="View Analytics"
              description="Track your progress with detailed performance metrics and improvement suggestions"
              icon={<TrendingUp size={32} className="text-teal-600" />}
              gradient="bg-teal-100"
              delay={600}
              onClick={handleViewAnalytics}
              badge="Popular"
              // disabled={!trainingStatus.hasUploadedData}
              
            />
            
            <FeatureCard
              title="Recent Sessions"
              description="Review your past interview performances and see how you've improved over time"
              icon={<Clock size={32} className="text-orange-600" />}
              gradient="bg-orange-100"
              delay={800}
              onClick={handleRecentInterviews}
            />
            
            <FeatureCard
              title="Quick Settings"
              description="Personalize your interview experience with custom preferences and configurations"
              icon={<Settings size={32} className="text-yellow-600" />}
              gradient="bg-yellow-100"
              delay={1000}
              onClick={handleSettings}
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
    </>
  );
}

export default Home;