import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider, BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import App from './App.jsx'
import Home from './components/Home/Home'
import Layout from './layout.jsx'
import Contact from './components/Contact/Contact.jsx'
import Users from './components/Users/Users.jsx'
import AdminDashboard from './components/Admin/AdminDashboard.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import LandingPage from './components/Home/LandingPage'
import Reviews from './components/Reviews/Reviews'
import Pricing from './components/Pricing/Pricing'
import InterviewPage from './components/Interview/InterviewPage'


const router  = createBrowserRouter(
  createRoutesFromElements(
    <>
    {/* Public route (no header/footer) */}
      <Route path="/" element={<LandingPage />} />
      

      {/*After logging in*/}
      <Route path = '/' element = {<Layout/>}>
      <Route path = 'home/:userid' element = {<Home/>}/>
      <Route path = 'home' element = {<Home/>}/>
      <Route path = 'contact' element = {<Contact/>}/>
      <Route path = 'user/:userid' element = {<Users/>}/>
      <Route path = 'reviews' element = {<Reviews/>}/>
      <Route path = 'pricing' element = {<Pricing/>}/>
      <Route path = 'interview' element = {<InterviewPage/>}/>
      <Route path = 'admin' element = {<ProtectedRoute><AdminDashboard/></ProtectedRoute>} />
      
    </Route>
    </>
  )
)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>,
)
