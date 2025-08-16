import React, { useState, useEffect }  from 'react';
import { useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
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

function SwiperReview({ name, role, company, rating, review, avatar, date, gradient, delay, verified }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div      
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} `}></div>
      
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
function LandingPage() {
  const navigate = useNavigate();
  const reviews = [
    {
      name: "Anurag Mudgal",
      role: "Software Engineer",
      company: "Google",
      rating: 5,
      review: "TrainMeAI completely transformed my interview preparation. The AI feedback was incredibly detailed and helped me identify areas I never knew I needed to improve. Landed my dream job at Google!",
      date: "Dec 2024",
      gradient: "from-blue-500 to-blue-700",
      
    },
    {
      name: "Kriish Tiwari",
      role: "Product Manager",
      company: "Microsoft",
      rating: 5,
      review: "The realistic interview scenarios and instant feedback made all the difference. I went from nervous wreck to confident interviewee in just two weeks of practice.",
      date: "Nov 2024",
      gradient: "from-purple-500 to-purple-700",
      
    },
    {
      name: "Shiv Ganesh",
      role: "Data Scientist",
      company: "Netflix",
      rating: 5,
      review: "Amazing platform! The AI interviewer asks questions that are incredibly similar to real interviews. The analytics dashboard helped me track my progress perfectly.",
      date: "Dec 2024",
      gradient: "from-teal-500 to-teal-700",
      
    }
  ];

  return (
    <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-white">Welcome to TrainMeAI</h1>
        <p className="mt-4 text-xl text-white/80">
          Transforming Recruitment with AI Interview Platform
        </p>
        <button
          onClick={() => navigate('/home')}
          className="mt-6 px-6 py-3 text-white font-semibold bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg shadow-lg hover:from-blue-600 hover:to-purple-600 transition"
        >
          Get Started
        </button>
        <h2 className="text-3xl font-bold text-white mt-20 mb-8 text-center">
          Testimonials
        </h2>
        <Swiper
          modules={[Navigation, Pagination, Autoplay]}
          spaceBetween={30}
          slidesPerView={1}
          navigation
          pagination={{ clickable: true }}
          autoplay={{ delay: 4000 }}
          // breakpoints={{
          //   768: { slidesPerView: 2 },
          //   1024: { slidesPerView: 3 },
          // }}
          className="pb-12"
        >
          {reviews.map((review, index) => (
  <SwiperSlide key={index}>
    <SwiperReview {...review} delay={0} />
  </SwiperSlide>
))}

        </Swiper>
      </div>
    </div>
  );
}

export default LandingPage;
