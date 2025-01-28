import React from "react";
import { BsLightningCharge } from "react-icons/bs";

const Hero = ({ setShowSignUp, setShowSignIn }) => {
  return (
    <div className="max-w-[1240px] mx-auto px-4 py-16 border-x border-[#272727]">
      <div className="flex flex-col items-center text-center">
        {/* Main Heading Section */}
        <div className="inline-flex items-center gap-3 mb-6 animate-fadeUp">
          <BsLightningCharge className="text-4xl text-white" />
          <h2 className="text-4xl font-bold text-white sm:text-5xl">YAERE</h2>
        </div>

        {/* Subheading with gradient text */}
        <h1
          className="text-5xl sm:text-6xl md:text-7xl font-bold mb-8 animate-fadeUp"
          style={{ animationDelay: "100ms" }}
        >
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
            Fast, Secure & Modern
          </span>
        </h1>

        {/* Description */}
        <p
          className="text-gray-400 text-lg sm:text-xl max-w-[800px] mb-12 animate-fadeUp"
          style={{ animationDelay: "200ms" }}
        >
          Have you ever needed a fast and secure chat application? YAERE doesn't
          collect a SINGLE byte of your data.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <button
            onClick={() => setShowSignUp(true)}
            className="px-4 sm:px-8 py-3 sm:py-4 bg-white text-black rounded-xl hover:bg-opacity-90
                                 transition-all duration-300 transform hover:scale-105
                                 active:scale-95 font-medium text-base sm:text-lg w-full sm:min-w-[200px] animate-fadeUp"
            style={{ animationDelay: "300ms" }}
          >
            Get Started
          </button>
          <button
            onClick={() => setShowSignIn(true)}
            className="px-4 sm:px-8 py-3 sm:py-4 border text-white rounded-xl hover:bg-opacity-90
                                 transition-all duration-300 transform hover:scale-105
                                 active:scale-95 font-medium text-base sm:text-lg w-full sm:min-w-[200px] animate-fadeUp"
            style={{ animationDelay: "300ms" }}
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

export default Hero;
