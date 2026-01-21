import React from "react"
import Logo from "./images/SAL_logo.png";
import './Header.css';

function Header(){
    return (
        <div className="header">
            <img src={Logo} alt="SAL Logo" />
            <h1>S.A.L. Post #707</h1>
        </div>
    )
}

export default Header