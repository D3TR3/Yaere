import React, { useState, useEffect } from "react";
import { AiOutlineClose } from "react-icons/ai";
import { RiUserUnfollowLine, RiUserLine } from "react-icons/ri";
import { useAuth } from "../contexts/authContext";
import { removeFriend, subscribeToFriendsList } from "../firebase/firestore";
import ConfirmationDeleteFriend from "./ConfirmationDeleteFriend";
import eventEmitter from "../utils/eventEmitter";

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

const AllFriends = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const [friends, setFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState(null);

  const defaultProfilePic =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiM0QjU1NjMiLz48cGF0aCBkPSJNMTAwIDEwNUM4My4zMzE1IDEwNSA3MCAxMTguMzMyIDcwIDEzNVYxNDVIODVWMTM1Qzg1IDEyNi43MTYgOTEuNzE1NyAxMjAgMTAwIDEyMEMxMDguMjg0IDEyMCAxMTUgMTI2LjcxNiAxMTUgMTM1VjE0NUgxMzBWMTM1QzEzMCAxMTguMzMyIDExNi42NjkgMTA1IDEwMCAxMDVaTTEwMCA1NUM5MS43MTU3IDU1IDg1IDYxLjcxNTcgODUgNzBDODUgNzguMjg0MyA5MS43MTU3IDg1IDEwMCA4NUMxMDguMjg0IDg1IDExNSA3OC4yODQzIDExNSA3MEMxMTUgNjEuNzE1NyAxMDguMjg0IDU1IDEwMCA1NVoiIGZpbGw9IndoaXRlIi8+PC9zdmc+";

  useEffect(() => {
    let unsubscribe;

    if (currentUser && isOpen) {
      setIsLoading(true);
      unsubscribe = subscribeToFriendsList(currentUser.uid, (friendsList) => {
        const addedFriends = friendsList.filter(
          (friend) => friend.status === "added"
        );
        setFriends(addedFriends);
        setIsLoading(false);
        // Emit friend list update event
        eventEmitter.emit("friendsListUpdate", addedFriends);
      });
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentUser, isOpen]);

  const handleRemoveFriend = async () => {
    if (!selectedFriend) return;

    try {
      await removeFriend(currentUser.uid, selectedFriend.id);
      setShowDeleteConfirmation(false);
      setSelectedFriend(null);

      // Emit removal event
      eventEmitter.emit("friendsListUpdate", {
        action: "remove",
        users: [{ id: currentUser.uid }, { id: selectedFriend.id }],
      });
    } catch (error) {
      setError("Error removing friend");
      console.error(error);
    }
  };

  const handleBackdropClick = (e) => {
    // Only close if clicking the actual backdrop
    if (e.target.classList.contains("backdrop")) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-[100] p-4 
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
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white"
          >
            <AiOutlineClose size={20} />
          </button>

          {/* Header section */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <RiUserLine className="text-3xl text-white" />
              <div>
                <h2 className="text-2xl font-bold text-white">Friends</h2>
                <p className="text-gray-400">
                  {friends.length} {friends.length === 1 ? "friend" : "friends"}
                </p>
              </div>
            </div>
            <p className="text-gray-400 mt-2">
              View and manage your friends list.
            </p>
          </div>

          {/* Content section with max height and scrolling */}
          <div className="max-h-[calc(100vh-16rem)] flex flex-col">
            {error && <p className="text-red-500 text-center mb-4">{error}</p>}

            {isLoading ? (
              <div className="text-center text-gray-400 py-8">
                Loading friends...
              </div>
            ) : friends.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <RiUserLine className="text-5xl mx-auto mb-4 opacity-50" />
                <p className="text-lg">No friends yet</p>
                <p className="text-sm mt-2">Add some friends to get started</p>
              </div>
            ) : (
              <div className="min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-[#272727] scrollbar-track-transparent pr-2">
                <div className="space-y-2">
                  {friends.map((friend) => (
                    <div
                      key={friend.id}
                      className="group flex items-center justify-between p-4 border border-[#272727] rounded-xl 
                                                   hover:bg-[#272727] transition-all duration-300"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={friend.photoURL || defaultProfilePic}
                          alt="Profile"
                          className="w-12 h-12 rounded-full object-cover border-2 border-[#272727] 
                                                           transition-all duration-300 group-hover:border-gray-500"
                        />
                        <div>
                          <p className="text-white font-medium group-hover:translate-x-0.5 transition-transform duration-200">
                            {friend.displayName}
                          </p>
                          {/* Add tags display */}
                          {friend.tags && friend.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {friend.tags.map((tag) => (
                                <span
                                  key={tag.id}
                                  className="text-xs px-2 py-0.5 rounded border text-white"
                                  style={{
                                    borderColor: tag.color,
                                    backgroundColor: darkenColor(tag.color),
                                  }}
                                >
                                  {tag.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedFriend(friend);
                          setShowDeleteConfirmation(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-red-400 hover:text-red-300 
                                                       hover:bg-red-500/10 rounded-xl transition-all duration-200"
                        title="Remove Friend"
                      >
                        <RiUserUnfollowLine size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmationDeleteFriend
        isOpen={showDeleteConfirmation}
        onClose={() => {
          setShowDeleteConfirmation(false);
          setSelectedFriend(null);
        }}
        onConfirm={handleRemoveFriend}
        friendName={selectedFriend?.displayName}
      />
    </div>
  );
};

export default AllFriends;
