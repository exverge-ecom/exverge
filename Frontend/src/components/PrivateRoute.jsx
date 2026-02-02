import React from 'react'
import { useEffect, useState  } from 'react';
import {toast} from "react-toastify";
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({children}) => {

    const [isAuthenticated, setIsAuthenticated] = useState(null);

    useEffect(()=>{
        const checkAuth = ()=>{
        const token = localStorage.getItem("token");
        if(token){
            setIsAuthenticated(true);
        }else{
            setIsAuthenticated(false);
        }
    }

    checkAuth();
    }, []);

    if(isAuthenticated === null){
        return  <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    }
 
    if(!isAuthenticated){
      toast.error("Login Failed")
      return <Navigate to="/"/>
    }

    return <>{children}</>;
}

export default PrivateRoute;
