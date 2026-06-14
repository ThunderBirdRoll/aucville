import React from 'react'
import Navbar from './component/Navbar'
import Home from './component/Home'
import Liveauction from './component/Liveauction'
import Cta from './component/Cta'
import Footer from './component/Footer'
export default function page() {
  return (
    <div>
    <Navbar/>
    <Home/>
    <Liveauction/>
    <Cta/>
    <Footer/>
    </div>
  )
}
