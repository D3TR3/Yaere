import React, { useState } from "react";
import { resendVerificationEmail, doSignOut } from "../firebase/auth";
import { BiMailSend } from "react-icons/bi";
import { FiLogOut, FiRefreshCw } from "react-icons/fi";

const EmailVerification = ({ email }) => {
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    try {
      await resendVerificationEmail();
      setSuccess("Verification email sent successfully!");
      setError("");
      setResendCooldown(60);

      // Start countdown
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      setError(error.message);
      setSuccess("");
    }
  };

  const handleSignOut = async () => {
    try {
      await doSignOut();
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-[#020202] border border-[#272727] rounded-xl p-6 max-w-md w-full">
        <div className="flex items-center justify-center mb-6">
          <BiMailSend className="text-5xl text-white" />
        </div>

        <h2 className="text-2xl font-bold text-white text-center mb-2">
          Verify Your Email
        </h2>

        <p className="text-gray-400 text-center mb-6">
          We've sent a verification email to{" "}
          <span className="text-white">{email}</span>. Please check your inbox
          and click the verification link.
        </p>

        {error && (
          <div className="bg-red-500/10 text-red-400 p-3 rounded-lg text-center mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 text-green-400 p-3 rounded-lg text-center mb-4">
            {success}
          </div>
        )}

        <button
          onClick={handleResend}
          disabled={resendCooldown > 0}
          className="w-full bg-white text-black font-bold py-3 rounded-xl
                             disabled:opacity-50 hover:bg-gray-100 transition-all duration-300"
        >
          {resendCooldown > 0
            ? `Resend in ${resendCooldown}s`
            : "Resend Verification Email"}
        </button>

        <button
          onClick={() => window.location.reload()}
          className="w-full mt-3 border border-white/20 text-white font-bold py-3 rounded-xl
                             hover:bg-white/10 transition-all duration-300 flex items-center justify-center gap-2"
        >
          <FiRefreshCw className="text-xl" />
          Reload Page
        </button>

        <button
          onClick={handleSignOut}
          className="w-full mt-3 border border-red-500/20 text-red-400 font-bold py-3 rounded-xl
                             hover:bg-red-500/10 transition-all duration-300 flex items-center justify-center gap-2"
        >
          <FiLogOut className="text-xl" />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default EmailVerification;
