import React, { useState, useEffect } from "react";
import { AiOutlineClose } from "react-icons/ai";
import { CgProfile } from "react-icons/cg";
import { updateUserProfile } from "../firebase/auth";
import { useAuth } from "../contexts/authContext";
import {
  isUsernameAvailable,
  updateUserDocument,
  defaultProfilePic,
} from "../firebase/firestore";
import { validateUsername } from "../utils/validation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import TagsModal from "./TagsModal";

// Add darkenColor utility after imports
const darkenColor = (color, factor = 5) => {
  // Remove the # if present
  const hex = color.replace("#", "");

  // Convert to RGB
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);

  // Darken each component
  r = Math.floor(r / factor);
  g = Math.floor(g / factor);
  b = Math.floor(b / factor);

  // Convert back to hex
  return `#${r.toString(16).padStart(2, "0")}${g
    .toString(16)
    .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
};

const ProfileDialog = ({ isOpen, onClose, currentUser }) => {
  const { refreshUser } = useAuth();
  const [userData, setUserData] = useState(null);
  const [displayName, setDisplayName] = useState(
    currentUser?.displayName?.replace("@", "") || ""
  );
  const [photoURL, setPhotoURL] = useState(currentUser?.photoURL || "");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isTagsModalOpen, setIsTagsModalOpen] = useState(false);

  // Add useEffect to fetch complete user data including tags
  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) return;

      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [currentUser]);

  // Update user data when tags change
  const handleTagsUpdate = async () => {
    if (!currentUser) return;
    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
    if (userDoc.exists()) {
      setUserData(userDoc.data());
    }
  };

  const handleBackdropClick = (e) => {
    // Only close if clicking the actual backdrop
    if (e.target.classList.contains("backdrop")) {
      setSuccessMessage(""); // Clear success message
      onClose();
    }
  };

  const handleClose = () => {
    setSuccessMessage(""); // Clear success message
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setIsLoading(true);

    try {
      const formattedUsername = displayName.startsWith("@")
        ? displayName
        : `@${displayName}`;

      // Validate username
      const validation = validateUsername(formattedUsername);
      if (!validation.isValid) {
        setError(validation.error);
        setIsLoading(false);
        return;
      }

      let shouldUpdate = false;
      const updates = {};

      if (formattedUsername !== currentUser.displayName) {
        const isAvailable = await isUsernameAvailable(formattedUsername);
        if (!isAvailable) {
          setError("Username is already taken");
          setIsLoading(false);
          return;
        }
        updates.displayName = formattedUsername;
        shouldUpdate = true;
      }

      if (photoURL !== currentUser.photoURL) {
        updates.photoURL = photoURL;
        shouldUpdate = true;
      }

      if (shouldUpdate) {
        // Update both Auth and Firestore
        await Promise.all([
          updateUserProfile(updates),
          updateUserDocument(currentUser.uid, updates),
        ]);

        await refreshUser();
        setSuccessMessage("Profile updated successfully!");
        // Remove onClose() to keep modal open
      }
    } catch (error) {
      setError("Failed to update profile");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  // Update the preview section to use userData for tags
  const userTags = userData?.tags || [];

  return (
    <>
      <div
        onClick={handleBackdropClick}
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 p-4
                     animate-fadeIn backdrop" // Added backdrop class
      >
        <div className="w-full p-4 flex items-center justify-center backdrop">
          {" "}
          {/* Added backdrop class */}
          <div
            className="w-full max-w-[500px] bg-[#020202] rounded-lg relative border border-[#272727] p-6
                         animate-scaleIn origin-top"
          >
            <button
              onClick={handleClose} // Update to use new handler
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors duration-200"
            >
              <AiOutlineClose size={20} />
            </button>

            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <CgProfile className="text-3xl text-white" />
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Edit Profile
                  </h2>
                  <p className="text-gray-400">
                    Customize your profile settings
                  </p>
                </div>
              </div>
            </div>

            {error && <p className="text-red-500 text-center mb-4">{error}</p>}
            {successMessage && (
              <p className="text-green-500 text-center mb-4">
                {successMessage}
              </p>
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
                  maxLength={5} // Limit to 5 characters
                />
                <p className="text-gray-400 mt-2 text-sm">
                  5 chars, accepted : "-" "_" "abc" "123"
                </p>
              </div>

              <div>
                <label className="block text-gray-400 mb-2">
                  Profile Picture
                </label>
                <input
                  type="url"
                  value={photoURL}
                  onChange={(e) => setPhotoURL(e.target.value)}
                  className="w-full bg-[#272727] border border-[#272727] text-white p-3 rounded-xl focus:outline-none focus:border-white transition-all duration-300"
                  placeholder="Enter image URL"
                />
                <p className="text-gray-400 mt-2 text-sm">
                  Enter an image URL for your profile picture
                </p>
              </div>

              {/* Add Preview Section */}
              <div>
                <label className="block text-gray-400 mb-2">Preview</label>
                <div className="border border-[#272727] rounded-xl p-4 bg-[#020202]">
                  {/* Chat Header Preview */}
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={
                          photoURL || currentUser?.photoURL || defaultProfilePic
                        }
                        alt="Profile Preview"
                        className="w-10 h-10 rounded-full object-cover border-2 border-[#272727] 
                    transition-all duration-300 group-hover:border-gray-500"
                        onError={(e) => {
                          e.target.src = defaultProfilePic;
                        }}
                      />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">
                        {displayName
                          ? displayName.startsWith("@")
                            ? displayName
                            : `@${displayName}`
                          : "@username"}
                      </h3>
                      {/* Update the tags display in the preview section */}
                      <div className="flex flex-wrap gap-1 mt-1">
                        {userTags.length > 0 &&
                          userTags.map((tag) => (
                            <span
                              key={tag.id}
                              className="text-xs px-2 py-0.5 rounded border text-white flex items-center gap-1"
                              style={{
                                borderColor: tag.color,
                                backgroundColor: darkenColor(tag.color),
                              }}
                            >
                              {tag.name}
                            </span>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Update the buttons container */}
              <div className="flex flex-col-reverse sm:flex-row gap-3 justify-between">
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full sm:w-auto px-4 py-2 text-gray-300 hover:text-white border border-[#272727] rounded-xl
                                     hover:bg-[#272727] transition-all duration-200 group"
                >
                  <span className="relative inline-block transform group-hover:translate-x-0.5 transition-transform duration-200">
                    Close
                  </span>
                </button>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setIsTagsModalOpen(true)}
                    className="w-full sm:w-auto px-6 py-2 bg-[#272727] text-white font-medium rounded-xl
                         hover:bg-[#323232] transition-all duration-200 flex items-center justify-center gap-2 group"
                  >
                    <span className="relative inline-block transform group-hover:translate-x-0.5 transition-transform duration-200">
                      Manage Tags
                    </span>
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full sm:w-auto px-6 py-2 bg-white text-black font-medium rounded-xl hover:bg-opacity-90
                         transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 group"
                  >
                    <span className="relative inline-block transform group-hover:translate-x-0.5 transition-transform duration-200">
                      {isLoading ? "Saving..." : "Save Changes"}
                    </span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
      <TagsModal
        isOpen={isTagsModalOpen}
        onClose={() => {
          setIsTagsModalOpen(false);
          handleTagsUpdate();
        }}
      />
    </>
  );
};

export default ProfileDialog;
