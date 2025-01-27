import React, { useState, useEffect } from 'react';
import { IoClose } from 'react-icons/io5';
import { BsCookie } from 'react-icons/bs';

const Cookies = () => {
    const [showBanner, setShowBanner] = useState(false);

    useEffect(() => {
        // Check sessionStorage instead of localStorage
        const hasBeenShown = sessionStorage.getItem('cookieBannerShown');
        if (!hasBeenShown) {
            const timer = setTimeout(() => {
                setShowBanner(true);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        sessionStorage.setItem('cookieBannerShown', 'true');
        setShowBanner(false);
    };

    const handleDecline = () => {
        sessionStorage.setItem('cookieBannerShown', 'true');
        setShowBanner(false);
    };

    if (!showBanner) return null;

    return (
        <div className="fixed bottom-0 inset-x-0 z-50 animate-slideUp">
            <div className="max-w-[1400px] mx-auto p-4">
                <div className="bg-[#020202] border border-[#272727] rounded-2xl shadow-2xl 
                            p-4 md:p-6 backdrop-blur-lg">
                    <div className="flex items-start gap-4">
                        <div className="hidden md:flex h-12 w-12 items-center justify-center rounded-full 
                                    bg-[#272727] text-white/80">
                            <BsCookie className="text-2xl" />
                        </div>

                        <div className="flex-1 min-w-0">
                            <h3 className="text-lg md:text-xl font-semibold text-white mb-2">
                                Cookie Notice
                            </h3>
                            <p className="text-gray-400 text-sm md:text-base mb-4 leading-relaxed">
                                We use cookies to enhance your browsing experience and improve our service. 
                                By continuing to use our site, you agree to our use of cookies.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                                <button
                                    onClick={handleAccept}
                                    className="px-6 py-2.5 bg-white text-black rounded-xl font-medium
                                             hover:bg-opacity-90 transition-all duration-200 
                                             transform hover:scale-105 active:scale-95"
                                >
                                    Got it
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={handleDecline}
                            className="p-1 text-gray-400 hover:text-white transition-colors"
                            aria-label="Close banner"
                        >
                            <IoClose className="text-xl" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cookies;
