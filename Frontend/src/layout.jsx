import React from 'react'
import Header from './components/Header/Header.jsx'
import Footer from './components/Footer/Footer.jsx'
import { Outlet, useLocation } from 'react-router-dom'

function Layout() {
  const location = useLocation();
  const isInterviewPage = location.pathname === '/interview';

  return (
    <div className="min-h-screen w-full flex flex-col bg-gray-50 text-gray-900">
      {!isInterviewPage && <Header />} 
      <main className="flex-1 bg-transparent">
        <Outlet /> {/* All page content goes here */}
      </main>
      {!isInterviewPage && <Footer />}
    </div>
  );
}

export default Layout