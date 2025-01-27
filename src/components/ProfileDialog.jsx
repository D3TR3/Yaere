import React, { useState } from 'react';
import { AiOutlineClose } from 'react-icons/ai';
import { CgProfile } from 'react-icons/cg';
import { updateUserProfile } from '../firebase/auth';
import { useAuth } from '../contexts/authContext';
import { isUsernameAvailable, updateUserDocument } from '../firebase/firestore';
import { validateUsername } from '../utils/validation';

const ProfileDialog = ({ isOpen, onClose, currentUser }) => {
    const { refreshUser } = useAuth();
    const [displayName, setDisplayName] = useState(currentUser?.displayName?.replace('@', '') || '');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const formattedUsername = displayName.startsWith('@') ? displayName : `@${displayName}`;

            // Validate username
            const validation = validateUsername(formattedUsername);
            if (!validation.isValid) {
                setError(validation.error);
                setIsLoading(false);
                return;
            }

            if (formattedUsername !== currentUser.displayName) {
                const isAvailable = await isUsernameAvailable(formattedUsername);
                if (!isAvailable) {
                    setError('Username is already taken');
                    setIsLoading(false);
                    return;
                }

                // Update both Auth and Firestore
                await Promise.all([
                    updateUserProfile({ displayName: formattedUsername }),
                    updateUserDocument(currentUser.uid, { displayName: formattedUsername })
                ]);

                await refreshUser();
                onClose();
            }
        } catch (error) {
            setError('Failed to update profile');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div 
            onClick={handleBackdropClick} 
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 p-4
                     animate-fadeIn"
        >
            <div 
                className="max-w-[500px] w-full bg-[#020202] rounded-lg relative border border-[#272727] p-6
                         animate-scaleIn origin-top" 
                onClick={e => e.stopPropagation()}
            >
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors duration-200"
                >
                    <AiOutlineClose size={20} />
                </button>

                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <CgProfile className="text-3xl text-white" />
                        <div>
                            <h2 className="text-2xl font-bold text-white">Edit Profile</h2>
                            <p className="text-gray-400">Customize your profile settings</p>
                        </div>
                    </div>
                    <p className="text-gray-400 mt-2">
                        Update your display name. Your username must start with @ and can only contain letters, numbers, and underscores.
                    </p>
                </div>

                {error && (
                    <p className="text-red-500 text-center mb-4">{error}</p>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-gray-400 mb-2">Display Name</label>
                        <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="w-full bg-[#272727] border border-[#272727] text-white p-3 rounded-xl
                                     focus:outline-none focus:border-white transition-all duration-300"
                            required
                        />
                    </div>

                    <div className="flex gap-3 justify-between">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-300 hover:text-white border border-[#272727] rounded-xl
                                     hover:bg-[#272727] transition-all duration-200 group"
                        >
                            <span className="relative inline-block transform group-hover:translate-x-0.5 transition-transform duration-200">
                                Cancel
                            </span>
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-6 py-2 bg-white text-black font-medium rounded-xl hover:bg-opacity-90
                                     transition-all duration-200 disabled:opacity-50 flex items-center gap-2 group"
                        >
                            <span className="relative inline-block transform group-hover:translate-x-0.5 transition-transform duration-200">
                                {isLoading ? 'Saving...' : 'Save Changes'}
                            </span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfileDialog;
