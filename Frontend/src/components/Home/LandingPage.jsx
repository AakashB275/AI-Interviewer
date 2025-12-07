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
    <div className="relative overflow-hidden rounded-2xl shadow-xl transition-all duration-700 transform">
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
      gradient: "bg-blue-100",
      
    },
    {
      name: "Kriish Tiwari",
      role: "Product Manager",
      company: "Microsoft",
      rating: 5,
      review: "The realistic interview scenarios and instant feedback made all the difference. I went from nervous wreck to confident interviewee in just two weeks of practice.",
      date: "Nov 2024",
      gradient: "bg-purple-100",
      
    },
    {
      name: "Shiv Ganesh",
      role: "Data Scientist",
      company: "Netflix",
      rating: 5,
      review: "Amazing platform! The AI interviewer asks questions that are incredibly similar to real interviews. The analytics dashboard helped me track my progress perfectly.",
      date: "Dec 2024",
      gradient: "bg-teal-100",
      
    }
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-gray-900">Welcome to TrainMeAI</h1>
        <p className="mt-4 text-xl text-gray-700">
          Transforming Recruitment with AI Interview Platform
        </p>
        <button
          onClick={() => navigate('/home')}
          className="mt-6 px-6 py-3 text-white font-semibold bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 transition"
        >
          Get Started
        </button>
        <h2 className="text-3xl font-bold text-gray-900 mt-20 mb-8 text-center">
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
