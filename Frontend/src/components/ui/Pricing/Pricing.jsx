import React, { useState, useEffect } from 'react';
import { 
  Check, 
  Star, 
  Zap, 
  Crown, 
  Sparkles,
  ArrowRight,
  Users,
  Clock,
  Shield
} from 'lucide-react';

function PricingCard({ title, price, period, description, features, isPopular, gradient, delay, buttonText, icon }) {
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
      } ${isHovered ? 'scale-105 shadow-2xl' : 'hover:scale-102'} ${
        isPopular ? 'ring-2 ring-yellow-400' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`}></div>
      
      {/* Animated background overlay */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] transition-all duration-300"></div>
      
      {/* Floating particles animation */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-2 h-2 bg-white/20 rounded-full transition-all duration-1000 ${
              isHovered ? 'animate-pulse' : ''
            }`}
            style={{
              left: `${15 + (i * 10)}%`,
              top: `${10 + (i * 8)}%`,
              animationDelay: `${i * 0.3}s`
            }}
          ></div>
        ))}
      </div>

      <div className="relative z-10 p-8 h-full flex flex-col min-h-[500px]">
        {isPopular && (
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
            <span className="bg-yellow-400 text-black px-4 py-2 mt-2 rounded-full text-sm font-bold flex items-center gap-2">
              <Crown size={16} />
              Most Popular
            </span>
          </div>
        )}
        
        <div className="text-center text-white mb-6">
          <div className="flex items-center justify-center mb-4">
            <div className={`p-3 rounded-full bg-white/20 backdrop-blur-sm transition-all duration-300 ${
              isHovered ? 'bg-white/30 scale-110' : ''
            }`}>
              {icon}
            </div>
          </div>
          
          <h3 className="text-2xl font-bold mb-2">{title}</h3>
          <div className="mb-4">
            <span className="text-4xl font-bold">${price}</span>
            <span className="text-white/80 ml-2">/{period}</span>
          </div>
          <p className="text-white/90 text-lg leading-relaxed mb-6">{description}</p>
        </div>
        
        <div className="flex-1 mb-6">
          <ul className="space-y-3">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center text-white/90">
                <Check size={18} className="text-green-400 mr-3 flex-shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <button className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${
          isPopular 
            ? 'bg-yellow-400 text-black hover:bg-yellow-300' 
            : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30'
        } ${isHovered ? 'transform translate-y-[-2px]' : ''}`}>
          {buttonText}
        </button>
      </div>
    </div>
  );
}

function Pricing() {
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowStats(true), 800);
    return () => clearTimeout(timer);
  }, []);

  const pricingPlans = [
    {
      title: "Starter",
      price: "0",
      period: "forever",
      description: "Perfect for getting started with AI interviews",
      features: [
        "5 AI interviews per month",
        "Basic feedback reports",
        "Standard question bank",
        "Email support",
        "Mobile app access"
      ],
      gradient: "from-blue-500 to-blue-700",
      buttonText: "Get Started Free",
      icon: <Zap size={28} className="text-white" />
    },
    {
      title: "Professional",
      price: "29",
      period: "month",
      description: "Advanced features for serious job seekers",
      features: [
        "Unlimited AI interviews",
        "Advanced analytics & insights",
        "Custom question creation",
        "Industry-specific templates",
        "Priority support",
        "Resume optimization tips",
        "Mock video interviews"
      ],
      isPopular: true,
      gradient: "from-purple-500 to-purple-700",
      buttonText: "Start Free Trial",
      icon: <Crown size={28} className="text-white" />
    },
    {
      title: "Enterprise",
      price: "99",
      period: "month",
      description: "Complete solution for teams and organizations",
      features: [
        "Everything in Professional",
        "Team management dashboard",
        "Custom branding",
        "API access",
        "Dedicated account manager",
        "Advanced reporting",
        "SSO integration",
        "Custom integrations"
      ],
      gradient: "from-teal-500 to-teal-700",
      buttonText: "Contact Sales",
      icon: <Users size={28} className="text-white" />
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
              <span>Flexible Pricing Plans</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Choose Your
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"> Plan</span>
            </h1>
            <p className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
              Start free and upgrade as you grow. All plans include our core AI interview features.
            </p>
          </div>

          {/* Stats Section */}
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 transition-all duration-700 transform ${
            showStats ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 text-white border border-white/20">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-white/20">
                  <Clock size={20} />
                </div>
                <div>
                  <p className="text-white/80 text-sm">Avg. Setup Time</p>
                  <p className="text-xl font-bold">2 minutes</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 text-white border border-white/20">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-white/20">
                  <Shield size={20} />
                </div>
                <div>
                  <p className="text-white/80 text-sm">Money Back</p>
                  <p className="text-xl font-bold">30 Days</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 text-white border border-white/20">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-white/20">
                  <Star size={20} />
                </div>
                <div>
                  <p className="text-white/80 text-sm">Customer Rating</p>
                  <p className="text-xl font-bold">4.9/5</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {pricingPlans.map((plan, index) => (
            <PricingCard
              key={index}
              {...plan}
              delay={200 + (index * 200)}
            />
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-20 text-center">
          <h2 className="text-3xl font-bold text-white mb-8">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-white border border-white/20">
              <h3 className="font-semibold mb-2">Can I change plans anytime?</h3>
              <p className="text-white/80">Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-white border border-white/20">
              <h3 className="font-semibold mb-2">Is there a free trial?</h3>
              <p className="text-white/80">Yes, all paid plans come with a 14-day free trial.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Pricing;