import React, { useState, useEffect } from "react";
import { FaGoogle } from "react-icons/fa";
import { AiOutlineClose } from "react-icons/ai";
import { RiLoginBoxLine } from "react-icons/ri"; // Add this import
import {
  doSignInWithEmailAndPassword,
  doSignInWithGoogle,
  doPasswordReset,
  getResetCooldownTime,
} from "../../firebase/auth";
import { useAuth } from "../../contexts/authContext";

const SignIn = ({ setShowSignIn, setShowSignUp }) => {
  const { refreshUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let intervalId;
    if (email && cooldown > 0) {
      // Check cooldown on component mount and email change
      setCooldown(getResetCooldownTime(email));

      // Update cooldown every second
      intervalId = setInterval(() => {
        const remaining = getResetCooldownTime(email);
        setCooldown(remaining);
        if (remaining === 0) {
          clearInterval(intervalId);
        }
      }, 1000);
    }
    return () => clearInterval(intervalId);
  }, [email, cooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await doSignInWithEmailAndPassword(email, password);
      await refreshUser();
      setShowSignIn(false);
    } catch (error) {
      // Customize the error message
      if (error.code === "auth/invalid-credential") {
        setError("Incorrect email or password");
      } else {
        setError(
          error.message.replace("Firebase:", "").replace("Error", "").trim()
        );
      }
    }
    setIsLoading(false);
  };

  const handleGoogleSignIn = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await doSignInWithGoogle();
      await refreshUser(); // Add refresh after Google sign in
      setShowSignIn(false);
    } catch (error) {
      setError(error.message);
    }
    setIsLoading(false);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setIsSendingReset(true);
    setError("");

    try {
      await doPasswordReset(email);
      setResetEmailSent(true);
      setCooldown(60);
      setError("");
    } catch (error) {
      if (error.message.includes("Please wait")) {
        setCooldown(parseInt(error.message.match(/\d+/)[0]));
      }
      setError(error.message);
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      setShowSignIn(false);
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center 
                       z-50 p-2 sm:p-4 animate-fadeIn"
    >
      <div
        className="w-full max-w-[500px] bg-[#020202] rounded-lg relative border border-[#272727] 
                          p-4 sm:p-6 animate-scaleIn origin-top"
      >
        <button
          onClick={() => setShowSignIn(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <AiOutlineClose size={20} />
        </button>

        <div className="mb-4 sm:mb-6">
          <div className="flex items-center gap-3 mb-2">
            <RiLoginBoxLine className="text-3xl text-white" />
            <div>
              <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
              <p className="text-gray-400">Sign in to your account</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          {error && (
            <p className="text-red-500 text-center bg-red-500/10 py-2 px-4 rounded-lg">
              {error}
            </p>
          )}
          {resetEmailSent && (
            <p className="text-green-500 text-center bg-green-500/10 py-2 px-4 rounded-lg">
              Password reset email sent! Check your inbox.
            </p>
          )}

          <div className="space-y-4">
            <div className="flex flex-col">
              <label className="text-white mb-1 font-medium">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-[#272727] border border-[#272727] text-white p-3 rounded-xl 
                                         focus:outline-none focus:border-gray-500 transition-all duration-300"
                type="email"
                required
              />
            </div>
            <div className="flex flex-col">
              <label className="text-white mb-1 font-medium">Password</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-[#272727] border border-[#272727] text-white p-3 rounded-xl 
                                         focus:outline-none focus:border-gray-500 transition-all duration-300"
                type="password"
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-4 my-4 sm:my-6">
            <div className="flex-1 h-[1px] bg-[#272727]"></div>
            <span className="text-gray-400 text-sm font-medium px-4">OR</span>
            <div className="flex-1 h-[1px] bg-[#272727]"></div>
          </div>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-12 h-12 rounded-xl border border-[#272727] flex items-center justify-center
                                     hover:bg-[#272727] transition-all duration-300"
            >
              <FaGoogle className="text-white text-xl" />
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-white text-black font-bold py-3 rounded-xl mt-4 
                                 disabled:opacity-50 hover:bg-gray-100 transition-all duration-300"
          >
            {isLoading ? "Signing In..." : "Sign In"}
          </button>

          <button
            type="button"
            onClick={handleForgotPassword}
            disabled={isSendingReset || cooldown > 0}
            className="w-full text-white font-bold py-3 rounded-xl border border-[#272727] 
                                 hover:bg-[#272727] transition-all duration-300 disabled:opacity-50"
          >
            {isSendingReset
              ? "Sending..."
              : cooldown > 0
              ? `Wait ${cooldown}s`
              : "Forgot Password?"}
          </button>

          <p className="text-gray-400 text-center mt-4">
            Don't have an account?
            <button
              onClick={() => {
                setShowSignIn(false);
                setShowSignUp(true);
              }}
              className="text-white ml-1 hover:underline focus:outline-none"
            >
              Sign Up
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default SignIn;
