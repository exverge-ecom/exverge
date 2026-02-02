// src/pages/SignupPage.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginSignupAPI } from "../utils/api.js";
// import AuthLayout from "../components/AuthLayout";

export default function Signup() {
  const initValues = {
    fullName: "",
    emailId: "",
    password: "",
    confirmPassword: "",
  };

  const [credentials, setCredentials] = useState(initValues);
  const navigate = useNavigate();
  // const [data, setData] = useState(null);
  function FormHandler(e) {
    const { name, value } = e.target;

    setCredentials({ ...credentials, [name]: value });
    // console.log(credentials);
  }

  async function SubmitHandler(e) {
    e.preventDefault();

    const { password, confirmPassword } = credentials;

    if (password !== confirmPassword) {
      alert("Password is Different");
      return;
    }
    // setData(credentials);
    // if(data == null) {return};
    const createUser = await loginSignupAPI.createUser(credentials);

    alert(createUser.message);

    navigate("/");

    setCredentials(initValues);
    // setData(null);
  }

  return (
    <div className="w-full max-w-md bg-white rounded-xl shadow-md px-6 py-8 sm:px-8 sm:py-10">
      <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-2 text-center">
        Sign up
      </h2>
      <p className="text-sm text-gray-500 mb-6 text-center">
        Create your Exverge account to get started.
      </p>

      <form className="space-y-5">
        {/* Name */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Full name
          </label>
          <input
            id="name"
            name="fullName"
            type="text"
            required
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm sm:text-base shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your name"
            value={credentials.fullName}
            onChange={(e) => FormHandler(e)}
          />
        </div>

        {/* Email */}
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

        {/* Password */}
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
            autoComplete="new-password"
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm sm:text-base shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Create a password"
            value={credentials.password}
            onChange={(e) => FormHandler(e)}
          />
        </div>

        {/* Confirm password */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Confirm password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            autoComplete="new-password"
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm sm:text-base shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Re-enter your password"
            value={credentials.confirmPassword}
            onChange={(e) => FormHandler(e)}
          />
        </div>

        <button
          type="submit"
          className="w-full flex justify-center items-center rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 sm:py-3 text-sm sm:text-base transition-colors"
          onClick={(e) => SubmitHandler(e)}
        >
          Create account
        </button>
      </form>

      <p className="mt-6 text-center text-xs sm:text-sm text-gray-600">
        Already have an account?{" "}
        <Link
          to="/"
          className="font-semibold text-blue-600 hover:text-blue-700"
        >
          Log in
        </Link>
      </p>

      <p className="mt-4 text-center text-xs sm:text-sm text-gray-500">
        © {new Date().getFullYear()} Exverge. All rights reserved.
      </p>
    </div>
  );
}
