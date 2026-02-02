// src/components/AuthLayout.jsx
import React, { useState, useEffect } from "react";
import exvergeLogo from "../assets/Exverge_Logo_blue.png";
import { Outlet } from "react-router-dom";
import { useNavigate } from "react-router-dom";

export default function AuthLayout({ children }) {

  const navigate = useNavigate();
  
  // const [loggedIn, setLoggedIn] = useState(false);

   const [loggedIn, setLoggedIn] = useState(
    Boolean(localStorage.getItem("token"))
  );

  // useEffect(() => {
  //   const token = localStorage.getItem("token");
  //   if(token){
  //     setLoggedIn(Boolean(token));
  //   }
  // }, []);

  const logHandler = (e)=>{
   e.preventDefault();
   localStorage.removeItem("token");
   localStorage.removeItem("user");
   setLoggedIn(false);
   navigate("/")
   
  }
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="w-full flex items-center justify-between px-8 sm:px-8 py-1 shadow-sm bg-white">
        <div className="flex items-center gap-2">
          <img
            src={exvergeLogo}
            alt="Exverge logo"
            className="h-24 w-40 sm:h-24"
          />
         
        </div>
        <div>
        {loggedIn && <button className="h-16 p-4 rounded bg-red-500 text-white" onClick={(e)=>logHandler(e)}>Logout</button>} 
         </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <Outlet/>
      </main>
    </div>
  );
}
