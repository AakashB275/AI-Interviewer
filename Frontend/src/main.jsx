import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider, BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import Home from './components/ui/Home/Home'
import Layout from './layout.jsx'
import Contact from './components/ui/Contact/Contact.jsx'
import Users from './components/ui/Users/Users.jsx'
import LandingPage from './components/ui/Home/landingPage'
import Reviews from './components/ui/Reviews/Reviews'
import Pricing from './components/ui/Pricing/Pricing'


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
      
    </Route>
    </>
  )
)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
