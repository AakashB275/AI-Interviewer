import React, { useState, useEffect } from 'react';
import { 
  Star, 
  Quote, 
  ThumbsUp, 
  Award, 
  Sparkles,
  User,
  Calendar,
  TrendingUp
} from 'lucide-react';

function ReviewCard({ name, role, company, rating, review, avatar, date, gradient, delay, verified }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl shadow-xl transition-all duration-700 transform ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      } ${isHovered ? 'scale-105 shadow-2xl' : 'hover:scale-102'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
              left: `${20 + (i * 12)}%`,
              top: `${15 + (i * 10)}%`,
              animationDelay: `${i * 0.2}s`
            }}
          ></div>
        ))}
      </div>

      <div className="relative z-10 p-6 h-full flex flex-col min-h-[320px]">
        {verified && (
          <div className="absolute top-4 right-4">
            <span className="bg-green-500/20 backdrop-blur-sm text-green-300 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
              <Award size={14} />
              Verified
            </span>
          </div>
        )}
        
        {/* Quote Icon */}
        <div className="mb-4">
          <Quote size={32} className="text-white/60" />
        </div>
        
        {/* Review Text */}
        <div className="flex-1 mb-6">
          <p className="text-white/90 text-lg leading-relaxed italic">
            "{review}"
          </p>
        </div>
        
        {/* Rating */}
        <div className="flex items-center mb-4">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={20}
              className={`${
                i < rating ? 'text-yellow-400 fill-current' : 'text-white/30'
              } transition-colors duration-300`}
            />
          ))}
          <span className="text-white/80 ml-2 font-semibold">{rating}.0</span>
        </div>
        
        {/* User Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <User size={20} className="text-white" />
            </div>
            <div>
              <h4 className="text-white font-semibold">{name}</h4>
              <p className="text-white/70 text-sm">{role} at {company}</p>
            </div>
          </div>
          <div className="text-white/60 text-sm flex items-center gap-1">
            <Calendar size={14} />
            {date}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, description }) {
  return (
    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-white border border-white/20 text-center">
      <div className="flex items-center justify-center mb-4">
        <div className="p-3 rounded-full bg-white/20">
          {icon}
        </div>
      </div>
      <div className="text-3xl font-bold mb-2">{value}</div>
      <div className="text-lg font-semibold mb-1">{label}</div>
      <div className="text-white/70 text-sm">{description}</div>
    </div>
  );
}

function Reviews() {
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowStats(true), 800);
    return () => clearTimeout(timer);
  }, []);

  const reviews = [
    {
      name: "Anurag Mudgal",
      role: "Software Engineer",
      company: "Google",
      rating: 5,
      review: "TrainMeAI completely transformed my interview preparation. The AI feedback was incredibly detailed and helped me identify areas I never knew I needed to improve. Landed my dream job at Google!",
      date: "Dec 2024",
      gradient: "from-blue-500 to-blue-700",
      // verified: true
    },
    {
      name: "Kriish Tiwari",
      role: "Product Manager",
      company: "Microsoft",
      rating: 5,
      review: "The realistic interview scenarios and instant feedback made all the difference. I went from nervous wreck to confident interviewee in just two weeks of practice.",
      date: "Nov 2024",
      gradient: "from-purple-500 to-purple-700",
      // verified: true
    },
    {
      name: "Shiv Ganesh",
      role: "Data Scientist",
      company: "Netflix",
      rating: 5,
      review: "Amazing platform! The AI interviewer asks questions that are incredibly similar to real interviews. The analytics dashboard helped me track my progress perfectly.",
      date: "Dec 2024",
      gradient: "from-teal-500 to-teal-700",
      // verified: true
    },
    {
      name: "Sagar Jadhav",
      role: "UX Designer",
      company: "Apple",
      rating: 5,
      review: "I was skeptical about AI interviews at first, but this platform exceeded all expectations. The feedback is constructive and the interface is beautifully designed.",
      date: "Nov 2024",
      gradient: "from-orange-500 to-red-500",
      // verified: true
    },
    {
      name: "Aary Jain",
      role: "Marketing Director",
      company: "Spotify",
      rating: 5,
      review: "The variety of interview types and industries covered is impressive. Helped me prepare for both technical and behavioral questions with equal effectiveness.",
      date: "Oct 2024",
      gradient: "from-indigo-500 to-indigo-700",
      
    },
    {
      name: "Arjun Murali",
      role: "DevOps Engineer",
      company: "Amazon",
      rating: 5,
      review: "Best investment I made for my career. The mock interviews felt so real that when I had my actual interviews, I was completely prepared and confident.",
      date: "Dec 2024",
      gradient: "from-pink-500 to-pink-700",
      // verified: true
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900">
      {/* Header Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-16">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md rounded-full px-6 py-2 text-white/90 mb-6 border border-white/20">
              <Sparkles size={18} className="text-yellow-400" />
              <span>Trusted by Thousands</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Success
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"> Stories</span>
            </h1>
            <p className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
              See how TrainMeAI has helped thousands of professionals land their dream jobs with confidence.
            </p>
          </div>

          {/* Stats Section */}
          <div className={`grid grid-cols-1 md:grid-cols-4 gap-6 mb-16 transition-all duration-700 transform ${
            showStats ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <StatCard 
              icon={<Star size={24} />} 
              label="Average Rating" 
              value="4.9/5" 
              description="From 10,000+ reviews"
            />
            <StatCard 
              icon={<TrendingUp size={24} />} 
              label="Success Rate" 
              value="94%" 
              description="Job offer received"
            />
            <StatCard 
              icon={<ThumbsUp size={24} />} 
              label="Satisfaction" 
              value="98%" 
              description="Would recommend"
            />
            <StatCard 
              icon={<Award size={24} />} 
              label="Companies" 
              value="500+" 
              description="Top employers"
            />
          </div>
        </div>
      </div>

      {/* Reviews Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {reviews.map((review, index) => (
            <ReviewCard
              key={index}
              {...review}
              delay={200 + (index * 150)}
            />
          ))}
        </div>

        <div className="mt-20 text-center">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Join Them?</h2>
            <p className="text-white/80 text-lg mb-6">
              Start your journey to interview success today. Join thousands of professionals who have already transformed their careers.
            </p>
            <button className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105">
              Start Free Trial
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Reviews;