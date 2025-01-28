import React, { useState } from "react";
import { FaGoogle } from "react-icons/fa";
import { AiOutlineClose } from "react-icons/ai";
import { RiUserAddLine } from "react-icons/ri"; // Add this import
import {
  doCreateUserWithEmailAndPassword,
  doSignInWithGoogle,
} from "../../firebase/auth";
import { useAuth } from "../../contexts/authContext";
import { isUsernameAvailable } from "../../firebase/firestore";
import { validateUsername } from "../../utils/validation";

const SignUp = ({ setShowSignUp, setShowSignIn }) => {
  const { refreshUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      setShowSignUp(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const formattedUsername = username.startsWith("@")
        ? username
        : `@${username}`;

      // Validate username
      const validation = validateUsername(formattedUsername);
      if (!validation.isValid) {
        setError(validation.error);
        setIsLoading(false);
        return;
      }

      // Check if username is available
      const isAvailable = await isUsernameAvailable(formattedUsername);
      if (!isAvailable) {
        setError("Username is already taken");
        setIsLoading(false);
        return;
      }

      await doCreateUserWithEmailAndPassword(
        email,
        password,
        formattedUsername
      );
      await refreshUser(); // Add refresh after sign up
      setShowSignUp(false);
    } catch (error) {
      // Customize error message
      if (error.code === "auth/email-already-in-use") {
        setError("Email is already in use");
      } else {
        setError(
          error.message.replace("Firebase:", "").replace("Error", "").trim()
        );
      }
    }
    setIsLoading(false);
  };

  const handleGoogleSignUp = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await doSignInWithGoogle();
      await refreshUser(); // Add refresh after Google sign up
      setShowSignUp(false);
    } catch (error) {
      setError(
        error.message.replace("Firebase:", "").replace("Error", "").trim()
      );
    }
    setIsLoading(false);
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
          onClick={() => setShowSignUp(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <AiOutlineClose size={20} />
        </button>

        <div className="mb-4 sm:mb-6">
          <div className="flex items-center gap-3 mb-2">
            <RiUserAddLine className="text-3xl text-white" />
            <div>
              <h2 className="text-2xl font-bold text-white">Create Account</h2>
              <p className="text-gray-400">Join our community today</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          {error && (
            <p className="text-red-500 text-center bg-red-500/10 py-2 px-4 rounded-lg">
              {error}
            </p>
          )}
          <div className="space-y-4">
            <div className="flex flex-col">
              <label className="text-white mb-1 font-medium">Username</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-[#272727] border border-[#272727] text-white p-3 rounded-xl 
                                         focus:outline-none focus:border-gray-500 transition-all duration-300"
                type="text"
                required
              />
            </div>
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
              onClick={handleGoogleSignUp}
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
            {isLoading ? "Creating Account..." : "Create Account"}
          </button>

          <p className="text-gray-400 text-center mt-4">
            Already have an account?
            <button
              onClick={() => {
                setShowSignUp(false);
                setShowSignIn(true);
              }}
              className="text-white ml-1 hover:underline focus:outline-none"
            >
              Sign In
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default SignUp;
