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
      <div className={`absolute inset-0 ${gradient}`}></div>
      
      {/* Subtle overlay for depth */}
      <div className="absolute inset-0 bg-white/5 transition-all duration-300"></div>

      <div className="relative z-10 p-8 h-full flex flex-col min-h-[500px]">
        {isPopular && (
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
            <span className="bg-yellow-400 text-black px-4 py-2 mt-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-md">
              <Crown size={16} />
              Most Popular
            </span>
          </div>
        )}
        
        <div className="text-center text-gray-800 mb-6">
          <div className="flex items-center justify-center mb-4">
            <div className={`p-3 rounded-full bg-white/80 shadow-md transition-all duration-300 ${
              isHovered ? 'bg-white scale-110 shadow-lg' : ''
            }`}>
              {icon}
            </div>
          </div>
          
          <h3 className="text-2xl font-bold mb-2">{title}</h3>
          <div className="mb-4">
            <span className="text-4xl font-bold text-gray-900">₹{price}</span>
            <span className="text-gray-600 ml-2">/{period}</span>
          </div>
          <p className="text-gray-700 text-lg leading-relaxed mb-6">{description}</p>
        </div>
        
        <div className="flex-1 mb-6">
          <ul className="space-y-3">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center text-gray-700">
                <Check size={18} className="text-green-600 mr-3 flex-shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <button className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${
          isPopular 
            ? 'bg-yellow-400 text-black hover:bg-yellow-500 shadow-md' 
            : 'bg-yellow-300 text-black hover:bg-yellow-200 shadow-sm border border-gray-200'
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
      gradient: "bg-blue-100",
      buttonText: "Get Started Free",
      icon: <Zap size={28} className="text-blue-600" />
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
      gradient: "bg-purple-100",
      buttonText: "Start Free Trial",
      icon: <Crown size={28} className="text-purple-600" />
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
      gradient: "bg-teal-100",
      buttonText: "Contact Sales",
      icon: <Users size={28} className="text-teal-600" />
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
              <span>Flexible Pricing Plans</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Choose Your
              <span className="text-blue-600"> Plan</span>
            </h1>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
              Start free and upgrade as you grow. All plans include our core AI interview features.
            </p>
          </div>

          {/* Stats Section */}
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 transition-all duration-700 transform ${
            showStats ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <div className="bg-white rounded-xl p-4 text-gray-800 border border-gray-200 shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-gray-100">
                  <Clock size={20} />
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Avg. Setup Time</p>
                  <p className="text-xl font-bold text-gray-900">2 minutes</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 text-gray-800 border border-gray-200 shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-gray-100">
                  <Shield size={20} />
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Money Back</p>
                  <p className="text-xl font-bold text-gray-900">30 Days</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 text-gray-800 border border-gray-200 shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-gray-100">
                  <Star size={20} />
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Customer Rating</p>
                  <p className="text-xl font-bold text-gray-900">4.9/5</p>
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
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="bg-white rounded-xl p-6 text-gray-800 border border-gray-200 shadow-sm">
              <h3 className="font-semibold mb-2 text-gray-900">Can I change plans anytime?</h3>
              <p className="text-gray-700">Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
            </div>
            <div className="bg-white rounded-xl p-6 text-gray-800 border border-gray-200 shadow-sm">
              <h3 className="font-semibold mb-2 text-gray-900">Is there a free trial?</h3>
              <p className="text-gray-700">Yes, all paid plans come with a 14-day free trial.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Pricing;