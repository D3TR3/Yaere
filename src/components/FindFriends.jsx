import React, { useState } from "react";
import {
  AiOutlineClose,
  AiOutlineUserAdd,
  AiOutlineCheck,
} from "react-icons/ai";
import { RiUserSearchLine } from "react-icons/ri";
import { useAuth } from "../contexts/authContext";
import {
  searchUserByUsername,
  sendFriendRequest,
  getFriendStatus,
} from "../firebase/firestore";
import { rateLimiters } from "../utils/rateLimit";

const FindFriends = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [isSearchCooldown, setIsSearchCooldown] = useState(false);

  // Add defaultProfilePic definition
  const defaultProfilePic =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiM0QjU1NjMiLz48cGF0aCBkPSJNMTAwIDEwNUM4My4zMzE1IDEwNSA3MCAxMTguMzMyIDcwIDEzNVYxNDVIODVWMTM1Qzg1IDEyNi43MTYgOTEuNzE1NyAxMjAgMTAwIDEyMEMxMDguMjg0IDEyMCAxMTUgMTI2LjcxNiAxMTUgMTM1VjE0NUgxMzBWMTM1QzEzMCAxMTguMzMyIDExNi42NjkgMTA1IDEwMCAxMDVaTTEwMCA1NUM5MS43MTU3IDU1IDg1IDYxLjcxNTcgODUgNzBDODUgNzguMjg0MyA5MS43MTU3IDg1IDEwMCA4NUMxMDguMjg0IDg1IDExNSA3OC4yODQzIDExNSA3MEMxMTUgNjEuNzE1NyAxMDguMjg0IDU1IDEwMCA1NVoiIGZpbGw9IndoaXRlIi8+PC9zdmc+";

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!username || isSearchCooldown) return;

    if (rateLimiters.search.isRateLimited(currentUser.uid)) {
      const remainingTime = rateLimiters.search.getRemainingTime(
        currentUser.uid
      );
      setError(
        `Search rate limit exceeded. Please wait ${remainingTime} seconds.`
      );
      setIsSearchCooldown(true);
      setTimeout(() => setIsSearchCooldown(false), remainingTime * 1000);
      return;
    }

    const searchUsername = username.startsWith("@") ? username : `@${username}`;
    setError("");
    setIsLoading(true);
    setSearchResult(null);

    try {
      const user = await searchUserByUsername(searchUsername);
      if (!user) {
        setError("No user by the given username has been found");
        return;
      }

      if (user.uid === currentUser.uid) {
        setError("You cannot add yourself");
        return;
      }

      const friendStatus = await getFriendStatus(currentUser.uid, user.uid);
      setSearchResult({
        ...user,
        isAdded: !!friendStatus,
        isPending: friendStatus?.status === "pending",
      });
    } catch (error) {
      console.error("Search error:", error);
      setError("Error searching for user");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendRequest = async (friend) => {
    try {
      await sendFriendRequest(currentUser.uid, friend.uid);
      setSearchResult({
        ...searchResult,
        isPending: true,
      });
      setUsername("");
    } catch (error) {
      setError("Error sending friend request");
      console.error(error);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
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
        onClick={(e) => e.stopPropagation()}
        className="max-w-[500px] w-full mx-auto bg-[#020202] rounded-lg relative border border-[#272727] p-4 sm:p-6
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
            <RiUserSearchLine className="text-3xl text-white" />
            <div>
              <h2 className="text-2xl font-bold text-white">Find Friends</h2>
              <p className="text-gray-400">Search users by username</p>
            </div>
          </div>
          <p className="text-gray-400 mt-2">
            Enter your friend's username to send them a friend request.
            Usernames start with @.
          </p>
        </div>

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="@username"
              className="flex-1 bg-[#272727] border border-[#272727] text-white p-3 rounded-xl 
                                     focus:outline-none focus:border-white transition-all duration-300"
            />
            <button
              type="submit"
              disabled={isLoading || !username || isSearchCooldown}
              className="w-full sm:w-auto px-6 py-2 text-white border border-[#272727] rounded-xl 
                                     hover:bg-[#272727] transition-all duration-200 group 
                                     disabled:opacity-50 disabled:cursor-not-allowed"
              title={
                isSearchCooldown ? "Please wait before searching again" : ""
              }
            >
              <span className="relative inline-block transform group-hover:translate-x-0.5 transition-transform duration-200">
                {isLoading
                  ? "Searching..."
                  : isSearchCooldown
                  ? "Wait..."
                  : "Search"}
              </span>
            </button>
          </div>
        </form>

        {/* Search Result */}
        {searchResult && (
          <div className="mt-4 space-y-2 max-h-[60vh] overflow-y-auto pr-2">
            <div
              className="group flex items-center justify-between p-4 border border-[#272727] rounded-xl 
                                      hover:bg-[#272727] transition-all duration-300"
            >
              <div className="flex items-center gap-3">
                <img
                  src={searchResult.photoURL || defaultProfilePic}
                  alt="Profile"
                  className="w-12 h-12 rounded-full object-cover border-2 border-[#272727] 
                                             transition-all duration-300 group-hover:border-gray-500"
                />
                <div>
                  <p className="text-white font-medium group-hover:translate-x-0.5 transition-transform duration-200">
                    {searchResult.displayName}
                  </p>
                  {/* Add tags display */}
                  {searchResult.tags && searchResult.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {searchResult.tags.map((tag) => (
                        <span
                          key={tag.id}
                          className="text-xs px-2 py-0.5 rounded border"
                          style={{ borderColor: tag.color, color: tag.color }}
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-sm text-gray-400 mt-1">
                    {searchResult.isAdded
                      ? "Already friends"
                      : searchResult.isPending
                      ? "Request pending"
                      : "User found"}
                  </p>
                </div>
              </div>
              {!searchResult.isAdded && !searchResult.isPending && (
                <button
                  onClick={() => handleSendRequest(searchResult)}
                  className="flex items-center gap-2 px-4 py-2 text-green-400 hover:text-green-300 
                                             hover:bg-green-500/10 rounded-xl transition-all duration-200"
                  title="Send friend request"
                >
                  <AiOutlineUserAdd size={20} />
                </button>
              )}
              {searchResult.isPending && (
                <span className="px-4 py-2 text-yellow-500/90">Pending</span>
              )}
              {searchResult.isAdded && !searchResult.isPending && (
                <span className="px-4 py-2 text-green-500/90 flex items-center gap-2">
                  <AiOutlineCheck size={20} />
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FindFriends;
