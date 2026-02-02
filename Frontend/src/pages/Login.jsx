// src/pages/LoginPage.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginSignupAPI } from "../utils/api.js";
import { toast } from "react-toastify";
// import AuthLayout from "../components/AuthLayout";

export default function LoginPage() {
  const initValues = {
    emailId: "",
    password: "",
  };
  const [credentials, setCredentials] = useState(initValues);
  const navigate = useNavigate();

  function FormHandler(e) {
    const { name, value } = e.target;

    setCredentials({ ...credentials, [name]: value });
  }

  const SubmitHandler = async (e) => {
    try {
      e.preventDefault();

      setCredentials({ ...credentials });

      const response = await loginSignupAPI.login(credentials);

      if (response.success) {
        localStorage.setItem("token", response.token);

        localStorage.setItem("user", JSON.stringify(response.data));

        // console.log(token);

        toast.success(`Welcome User, You are successfully Logged In`);
        // alert(`Welcome User, You are successfully Logged In`);

        navigate("/home");

        setCredentials(initValues);
      }
    } catch (error) {
      console.error(`Error in Login`, error);
      toast.error(error.message || "Login Failed");
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-xl shadow-md px-6 py-8 sm:px-8 sm:py-10">
      <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-2 text-center">
        Login
      </h2>
      <p className="text-sm text-gray-500 mb-6 text-center">
        Sign in with your email and password to continue.
      </p>

      <form className="space-y-5">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email address
          </label>
          <input
            id="email"
            name="emailId"
            type="email"
            required
            autoComplete="email"
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm sm:text-base shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="you@example.com"
            value={credentials.emailId}
            onChange={(e) => FormHandler(e)}
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm sm:text-base shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your password"
            value={credentials.password}
            onChange={(e) => FormHandler(e)}
          />
        </div>

        <button
          type="submit"
          className="w-full flex justify-center items-center rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 sm:py-3 text-sm sm:text-base transition-colors"
          onClick={(e) => SubmitHandler(e)}
        >
          Sign in
        </button>
      </form>

      <p className="mt-6 text-center text-xs sm:text-sm text-gray-600">
        Don&apos;t have an account?{" "}
        <Link
          to="/signup"
          className="font-semibold text-blue-600 hover:text-blue-700"
        >
          Sign up
        </Link>
      </p>

      <p className="mt-4 text-center text-xs sm:text-sm text-gray-500">
        © {new Date().getFullYear()} Exverge. All rights reserved.
      </p>
    </div>
  );
}
