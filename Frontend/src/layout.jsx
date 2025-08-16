import React from 'react'
import Header from './components/ui/Header/Header.jsx'
import Footer from './components/ui/Footer/Footer.jsx'
import { Outlet } from 'react-router-dom'

function Layout() {
   return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 text-white">
      <Header /> 
      <main className="flex-1 bg-transparent">
        <Outlet /> {/* All page content goes here */}
      </main>
      <Footer />
    </div>
  );
}

export default Layout