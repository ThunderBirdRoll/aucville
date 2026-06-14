import React from 'react'
import Navbar from './component/Navbar'
import Home from './component/Home'
import Liveauction from './component/Liveauction'
import Cta from './component/Cta'
import Footer from './component/Footer'
import WelcomePopup from './component/Welcome'
export default function page() {
  return (
    <div>
      <WelcomePopup />
    <Navbar/>
    <Home/>
    <Liveauction/>
    <Cta/>
    <Footer/>
    </div>
  )
}
