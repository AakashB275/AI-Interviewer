import React from 'react'
import Header from './components/Header/Header.jsx'
import Footer from './components/Footer/Footer.jsx'
import { Outlet } from 'react-router-dom'

function Layout() {
   return (
    <div className="min-h-screen w-full flex flex-col bg-gray-50 text-gray-900">
      <Header /> 
      <main className="flex-1 bg-transparent">
        <Outlet /> {/* All page content goes here */}
      </main>
      <Footer />
    </div>
  );
}

export default Layout