import React from 'react'
import './Footer.css'

import footer_logo from '../Assets/logo_big.png'
import instagram_icon from '../Assets/instagram_icon.png'
import pintrest_icon from '../Assets/pintester_icon.png'
import whatsapp_icon from '../Assets/whatsapp_icon.png'
import facebook_icon from '../Assets/facebook_icon.png'
import x_icon from '../Assets/x_icon.png'

const Footer = () => {
  return (
    <div className='footer'>
      <div className="footer-logo">
        <img src={footer_logo} alt="" />
        <p>ETERNAL YOUTH</p>
      </div>
   
 <div className="footer-social-icons">
        <div className="footer-icons-container">
            <img src={facebook_icon} alt="Facebook" />
        </div>
        <div className="footer-icons-container">
            <img src={x_icon} alt="X" />
        </div>
        <div className="footer-icons-container">
            <img src={pintrest_icon} alt="Pinterest" />
        </div>
        <div className="footer-icons-container">
            <img src={instagram_icon} alt="Instagram" />
        </div>
        <div className="footer-icons-container">
            <img src={whatsapp_icon} alt="WhatsApp" />
        </div>
      </div>
      <div className="footer-copyright">
        <hr />
        <p>Copyright @ 2026 - All Right Reserved.</p>
      </div>
    </div>
  )
}

export default Footer
