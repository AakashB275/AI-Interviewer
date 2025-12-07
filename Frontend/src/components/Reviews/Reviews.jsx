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
      <div className={`absolute inset-0 ${gradient}`}></div>
      
      {/* Subtle overlay for depth */}
      <div className="absolute inset-0 bg-white/5 transition-all duration-300"></div>

      <div className="relative z-10 p-6 h-full flex flex-col min-h-[320px]">
        {verified && (
          <div className="absolute top-4 right-4">
            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 shadow-sm">
              <Award size={14} />
              Verified
            </span>
          </div>
        )}
        
        {/* Quote Icon */}
        <div className="mb-4">
          <Quote size={32} className="text-gray-400" />
        </div>
        
        {/* Review Text */}
        <div className="flex-1 mb-6">
          <p className="text-gray-800 text-lg leading-relaxed italic">
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
                i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
              } transition-colors duration-300`}
            />
          ))}
          <span className="text-gray-700 ml-2 font-semibold">{rating}.0</span>
        </div>
        
        {/* User Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-white/80 shadow-sm flex items-center justify-center">
              <User size={20} className="text-gray-600" />
            </div>
            <div>
              <h4 className="text-gray-900 font-semibold">{name}</h4>
              <p className="text-gray-600 text-sm">{role} at {company}</p>
            </div>
          </div>
          <div className="text-gray-500 text-sm flex items-center gap-1">
            <Calendar size={14} />
            {date}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, description, colorClass }) {
  return (
    <div className="bg-white rounded-xl p-6 text-gray-800 border border-gray-200 shadow-sm text-center">
      <div className="flex items-center justify-center mb-4">
        <div className={`p-3 rounded-full ${colorClass || 'bg-gray-100'}`}>
          {icon}
        </div>
      </div>
      <div className="text-3xl font-bold mb-2 text-gray-900">{value}</div>
      <div className="text-lg font-semibold mb-1 text-gray-800">{label}</div>
      <div className="text-gray-600 text-sm">{description}</div>
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
      gradient: "bg-blue-100",
      // verified: true
    },
    {
      name: "Kriish Tiwari",
      role: "Product Manager",
      company: "Microsoft",
      rating: 5,
      review: "The realistic interview scenarios and instant feedback made all the difference. I went from nervous wreck to confident interviewee in just two weeks of practice.",
      date: "Nov 2024",
      gradient: "bg-purple-100",
      // verified: true
    },
    {
      name: "Shiv Ganesh",
      role: "Data Scientist",
      company: "Netflix",
      rating: 5,
      review: "Amazing platform! The AI interviewer asks questions that are incredibly similar to real interviews. The analytics dashboard helped me track my progress perfectly.",
      date: "Dec 2024",
      gradient: "bg-teal-100",
      // verified: true
    },
    {
      name: "Sagar Jadhav",
      role: "UX Designer",
      company: "Apple",
      rating: 5,
      review: "I was skeptical about AI interviews at first, but this platform exceeded all expectations. The feedback is constructive and the interface is beautifully designed.",
      date: "Nov 2024",
      gradient: "bg-orange-100",
      // verified: true
    },
    {
      name: "Aary Jain",
      role: "Marketing Director",
      company: "Spotify",
      rating: 5,
      review: "The variety of interview types and industries covered is impressive. Helped me prepare for both technical and behavioral questions with equal effectiveness.",
      date: "Oct 2024",
      gradient: "bg-indigo-100",
      
    },
    {
      name: "Arjun Murali",
      role: "DevOps Engineer",
      company: "Amazon",
      rating: 5,
      review: "Best investment I made for my career. The mock interviews felt so real that when I had my actual interviews, I was completely prepared and confident.",
      date: "Dec 2024",
      gradient: "bg-pink-100",
      // verified: true
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="relative overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-16">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-white rounded-full px-6 py-2 text-gray-700 mb-6 border border-gray-200 shadow-sm">
              <Sparkles size={18} className="text-yellow-500" />
              <span>Trusted by Thousands</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Success
              <span className="text-blue-600"> Stories</span>
            </h1>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
              See how TrainMeAI has helped thousands of professionals land their dream jobs with confidence.
            </p>
          </div>

          {/* Stats Section */}
          <div className={`grid grid-cols-1 md:grid-cols-4 gap-6 mb-16 transition-all duration-700 transform ${
            showStats ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <StatCard 
              icon={<Star size={24} className="text-yellow-600" />} 
              label="Average Rating" 
              value="4.9/5" 
              description="From 10,000+ reviews"
              colorClass="bg-yellow-100"
            />
            <StatCard 
              icon={<TrendingUp size={24} className="text-green-600" />} 
              label="Success Rate" 
              value="94%" 
              description="Job offer received"
              colorClass="bg-green-100"
            />
            <StatCard 
              icon={<ThumbsUp size={24} className="text-blue-600" />} 
              label="Satisfaction" 
              value="98%" 
              description="Would recommend"
              colorClass="bg-blue-100"
            />
            <StatCard 
              icon={<Award size={24} className="text-purple-600" />} 
              label="Companies" 
              value="500+" 
              description="Top employers"
              colorClass="bg-purple-100"
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
          <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Join Them?</h2>
            <p className="text-gray-700 text-lg mb-6">
              Start your journey to interview success today. Join thousands of professionals who have already transformed their careers.
            </p>
            <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 shadow-md">
              Start Free Trial
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Reviews;