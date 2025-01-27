import React from 'react';
import { AiOutlineClose } from 'react-icons/ai';
import { RiDeleteBin6Line } from 'react-icons/ri';

const ConfirmationDeleteFriend = ({ isOpen, onClose, onConfirm, friendName }) => {
    if (!isOpen) return null;

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div 
            onClick={handleBackdropClick} 
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-[60] p-4
                     animate-fadeIn"
        >
            <div 
                onClick={e => e.stopPropagation()} 
                className="max-w-[400px] w-full bg-[#020202] rounded-lg relative border border-[#272727] p-6
                         animate-scaleIn origin-top"
            >
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors duration-200"
                >
                    <AiOutlineClose size={20} />
                </button>

                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <RiDeleteBin6Line className="text-3xl text-red-500" />
                        <div>
                            <h2 className="text-2xl font-bold text-white">Remove Friend</h2>
                            <p className="text-red-400">This action WILL delete your messages!</p>
                        </div>
                    </div>
                    <p className="text-gray-400 mt-2">
                        Are you sure you want to remove <span className="text-white font-medium">{friendName}</span> from your friends list? 
                    </p>
                </div>

                <div className="flex gap-3 justify-between">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-300 hover:text-white border border-[#272727] rounded-xl
                                 hover:bg-[#272727] transition-all duration-200 group"
                    >
                        <span className="relative inline-block transform group-hover:translate-x-0.5 transition-transform duration-200">
                            Cancel
                        </span>
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 bg-red-500/10 text-red-400 hover:text-red-300 rounded-xl
                                 hover:bg-red-500/20 transition-all duration-200 flex items-center gap-2 group"
                    >
                        <RiDeleteBin6Line 
                            className="transform transition-transform duration-200 group-hover:scale-110" 
                        />
                        <span className="relative inline-block transform group-hover:translate-x-0.5 transition-transform duration-200">
                            Remove Friend
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationDeleteFriend;
