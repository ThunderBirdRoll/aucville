import React from 'react'
import Navbar from './component/Navbar'
import Home from './component/Home'
import Liveauction from './component/Liveauction'
import Cta from './component/Cta'
import Footer from './component/Footer'
import WelcomePopup from './component/Welcome'
import Image from "./component/Image"
export default function page() {
  return (
    <div 
    style={
             {
                 "background":  "#ffffff"
             }
    }
    >
      <WelcomePopup />
    <Navbar/>
    <Home/>

    <Liveauction/>
        <Image/>
    <Cta/>
    <Footer/>
    </div>
  )
}
