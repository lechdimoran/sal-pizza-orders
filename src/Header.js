import React from "react"
import { useAuth } from './AuthContext';
import Logo from "./images/SAL_logo.png";
import './Header.css';

function Header(){
    const { user, logout } = useAuth();

    return (
        <div className="header">
            <img src={Logo} alt="SAL Logo" />
            <h1>S.A.L. Post #707</h1>
            <div className="header-actions">
                {user && (
                    <div className="user-info">
                        <span>Welcome, {user.username || user.name}</span>
                        <button onClick={logout} className="logout-btn">
                            Logout
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Header