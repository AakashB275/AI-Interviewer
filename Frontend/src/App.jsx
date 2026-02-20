import './App.css'
import { Button } from "@/components/ui/button"
import { ThemeProvider } from "@/components/ui/theme-provider"
import Header from './components/Header/Header'
import Layout from './layout'
import Footer from './components/Footer/Footer'


function App() {
  

  return (
    <>
    <Header/>
    <Layout/>
    <Footer/>
    </>
  )
}

export default App
