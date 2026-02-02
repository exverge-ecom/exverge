import ReactDOM from "react-dom/client";
import { Routes, Route } from "react-router-dom";
import SignupPage from "./pages/Signup.jsx";
import LoginPage from './pages/Login.jsx';
import './App.css'
import Dashboard from "./pages/Dashboard.jsx";
import AuthLayout from "./components/AuthLayout.jsx";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PrivateRoute from "./components/PrivateRoute.jsx";

function App() {

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    {/* <Dashboard/> */}
      <Routes>

        <Route path="/" element={<AuthLayout/>}>

        <Route path="/" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/home" element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>} />

        </Route>
      </Routes>
   
    </>
  )
}

export default App
