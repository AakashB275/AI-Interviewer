import React, { useState, useEffect } from 'react';
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
  Target
} from 'lucide-react';

function FeatureCard({ title, description, icon, gradient, delay, onClick, badge }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl shadow-xl cursor-pointer transition-all duration-700 transform ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      } ${isHovered ? 'scale-105 shadow-2xl' : 'hover:scale-102'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`}></div>
      
      {/* Animated background overlay */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] transition-all duration-300"></div>
      
      {/* Floating particles animation */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-2 h-2 bg-white/20 rounded-full transition-all duration-1000 ${
              isHovered ? 'animate-pulse' : ''
            }`}
            style={{
              left: `${20 + (i * 15)}%`,
              top: `${10 + (i * 10)}%`,
              animationDelay: `${i * 0.2}s`
            }}
          ></div>
        ))}
      </div>

      <div className="relative z-10 p-8 h-full flex flex-col justify-between min-h-[280px]">
        {badge && (
          <div className="absolute top-4 right-4">
            <span className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
              {badge}
            </span>
          </div>
        )}
        
        <div className="flex items-center justify-center mb-6">
          <div className={`p-4 rounded-full bg-white/20 backdrop-blur-sm transition-all duration-300 ${
            isHovered ? 'bg-white/30 scale-110' : ''
          }`}>
            {icon}
          </div>
        </div>
        
        <div className="text-center text-white">
          <h3 className="text-2xl font-bold mb-3 leading-tight">{title}</h3>
          <p className="text-white/90 text-lg leading-relaxed">{description}</p>
          
          <div className={`mt-6 inline-flex items-center space-x-2 text-white/80 transition-all duration-300 ${
            isHovered ? 'text-white transform translate-x-1' : ''
          }`}>
            <span className="font-medium">Get Started</span>
            <ArrowRight size={18} className="transition-transform duration-300" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 text-white border border-white/20">
      <div className="flex items-center space-x-3">
        <div className="p-2 rounded-lg bg-white/20">
          {icon}
        </div>
        <div>
          <p className="text-white/80 text-sm">{label}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
}

function Home() {
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowStats(true), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleStartInterview = () => {
    console.log('Starting interview...');
    // Add navigation logic here
  };

  const handleTrainAI = () => {
    console.log('Opening AI training...');
    // Add navigation logic here
  };

  const handleViewAnalytics = () => {
    console.log('Opening analytics...');
    // Add navigation logic here
  };

  const handleRecentInterviews = () => {
    console.log('Opening recent interviews...');
    // Add navigation logic here
  };

  const handleSettings = () => {
    console.log('Opening settings...');
    // Add navigation logic here
  };

  const handleQuickTips = () => {
    console.log('Opening tips...');
    // Add navigation logic here
  };

  return (
    <div className="min-h-screen  bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900">
      {/* Header Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-16">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md rounded-full px-6 py-2 text-white/90 mb-6 border border-white/20">
              <Sparkles size={18} className="text-yellow-400" />
              <span>AI-Powered Interview Platform</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Master Your
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"> Interview</span>
            </h1>
            <p className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
              Practice with our advanced AI interviewer, get real-time feedback, and land your dream job with confidence.
            </p>
          </div>

          {/* Stats Section */}
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 transition-all duration-700 transform ${
            showStats ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <StatCard icon={<Users size={20} />} label="Active Users" value="10,000+" />
            <StatCard icon={<Target size={20} />} label="Success Rate" value="94%" />
            <StatCard icon={<Star size={20} />} label="Avg Rating" value="4.9/5" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard
            title="Start Interview"
            description="Begin your AI-powered interview session with personalized questions and real-time feedback"
            icon={<Play size={32} className="text-white" />}
            gradient="from-blue-500 to-blue-700"
            delay={200}
            onClick={handleStartInterview}
            badge="Popular"
          />
          
          <FeatureCard
            title="Train Your AI"
            description="Customize and improve your AI interviewer with specific job roles and requirements"
            icon={<Brain size={32} className="text-white" />}
            gradient="from-purple-500 to-purple-700"
            delay={400}
            onClick={handleTrainAI}
            badge="New"
          />
          
          <FeatureCard
            title="View Analytics"
            description="Track your progress with detailed performance metrics and improvement suggestions"
            icon={<TrendingUp size={32} className="text-white" />}
            gradient="from-teal-500 to-teal-700"
            delay={600}
            onClick={handleViewAnalytics}
          />
          
          <FeatureCard
            title="Recent Sessions"
            description="Review your past interview performances and see how you've improved over time"
            icon={<Clock size={32} className="text-white" />}
            gradient="from-orange-500 to-red-500"
            delay={800}
            onClick={handleRecentInterviews}
          />
          
          <FeatureCard
            title="Quick Settings"
            description="Personalize your interview experience with custom preferences and configurations"
            icon={<Settings size={32} className="text-white" />}
            gradient="from-indigo-500 to-indigo-700"
            delay={1000}
            onClick={handleSettings}
          />
          
          <FeatureCard
            title="Interview Tips"
            description="Access expert advice and proven strategies to excel in your next interview"
            icon={<Sparkles size={32} className="text-white" />}
            gradient="from-pink-500 to-pink-700"
            delay={1200}
            onClick={handleQuickTips}
          />
        </div>
      </div>
    </div>
  );
}

export default Home;