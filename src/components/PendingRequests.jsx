import React, { useState, useEffect } from "react";
import { AiOutlineClose } from "react-icons/ai";
import { RiUserAddLine, RiCheckLine, RiCloseLine } from "react-icons/ri";
import { useAuth } from "../contexts/authContext";
import {
  getPendingRequests,
  acceptFriendRequest,
  rejectFriendRequest,
} from "../firebase/firestore";
import eventEmitter from "../utils/eventEmitter";

const PendingRequests = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const [pendingRequests, setPendingRequests] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const defaultProfilePic =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiM0QjU1NjMiLz48cGF0aCBkPSJNMTAwIDEwNUM4My4zMzE1IDEwNSA3MCAxMTguMzMyIDcwIDEzNVYxNDVIODVWMTM1Qzg1IDEyNi43MTYgOTEuNzE1NyAxMjAgMTAwIDEyMEMxMDguMjg0IDEyMCAxMTUgMTI2LjcxNiAxMTUgMTM1VjE0NUgxMzBWMTM1QzEzMCAxMTguMzMyIDExNi42NjkgMTA1IDEwMCAxMDVaTTEwMCA1NUM5MS43MTU3IDU1IDg1IDYxLjcxNTcgODUgNzBDODUgNzguMjg0MyA5MS43MTU3IDg1IDEwMCA4NUMxMDguMjg0IDg1IDExNSA3OC4yODQzIDExNSA3MEMxMTUgNjEuNzE1NyAxMDguMjg0IDU1IDEwMCA1NVoiIGZpbGw9IndoaXRlIi8+PC9zdmc+";

  useEffect(() => {
    const loadRequests = async () => {
      if (!currentUser || !isOpen) return;

      try {
        setIsLoading(true);
        setError("");
        const requests = await getPendingRequests(currentUser.uid);
        setPendingRequests(requests);
      } catch (error) {
        setError("Error loading pending requests");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRequests();
  }, [currentUser, isOpen]); // Added isOpen as dependency

  const handleAcceptRequest = async (friendId) => {
    try {
      const result = await acceptFriendRequest(currentUser.uid, friendId);
      setPendingRequests((prev) =>
        prev.filter((request) => request.id !== friendId)
      );

      // Emit event with both users' data
      eventEmitter.emit("friendsListUpdate", {
        action: "add",
        users: [result.user, result.friend],
      });
    } catch (error) {
      setError("Error accepting request");
      console.error(error);
    }
  };

  const handleRejectRequest = async (friendId) => {
    try {
      await rejectFriendRequest(currentUser.uid, friendId);
      setPendingRequests((prev) =>
        prev.filter((request) => request.id !== friendId)
      );
    } catch (error) {
      setError("Error rejecting request");
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
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-start 
                 overflow-y-auto min-h-screen z-[100] animate-fadeIn"
    >
      <div className="min-h-screen py-8 px-4 flex items-center justify-center w-full">
        <div
          className="w-full max-w-[500px] bg-[#020202] rounded-lg border border-[#272727] p-6
                     animate-scaleIn origin-top relative mx-auto"
          onClick={(e) => e.stopPropagation()}
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
              <RiUserAddLine className="text-3xl text-white" />
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Friend Requests
                </h2>
                <p className="text-gray-400">
                  {pendingRequests.length} pending{" "}
                  {pendingRequests.length === 1 ? "request" : "requests"}
                </p>
              </div>
            </div>
            <p className="text-gray-400 mt-2">
              Accept or decline friend requests from other users.
            </p>
          </div>

          {/* Content section with max height and scrolling */}
          <div className="max-h-[calc(100vh-16rem)] flex flex-col">
            {error && <p className="text-red-500 text-center mb-4">{error}</p>}

            {isLoading ? (
              <div className="text-center text-gray-400 py-8">
                Loading requests...
              </div>
            ) : pendingRequests.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <RiUserAddLine className="text-5xl mx-auto mb-4 opacity-50" />
                <p className="text-lg">No pending requests</p>
                <p className="text-sm mt-2">
                  When someone adds you, they'll appear here
                </p>
              </div>
            ) : (
              <div className="min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-[#272727] scrollbar-track-transparent pr-2">
                <div className="space-y-2">
                  {pendingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="group flex items-center justify-between p-4 border border-[#272727] rounded-xl 
                                                   hover:bg-[#272727] transition-all duration-300"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={request.photoURL || defaultProfilePic}
                          alt="Profile"
                          className="w-12 h-12 rounded-full object-cover border-2 border-[#272727] 
                                                           transition-all duration-300 group-hover:border-gray-500"
                        />
                        <div>
                          <p className="text-white font-medium group-hover:translate-x-0.5 transition-transform duration-200">
                            {request.displayName}
                          </p>
                          {/* Add tags display */}
                          {request.tags && request.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {request.tags.map((tag) => (
                                <span
                                  key={tag.id}
                                  className="text-xs px-2 py-0.5 rounded border"
                                  style={{
                                    borderColor: tag.color,
                                    color: tag.color,
                                  }}
                                >
                                  {tag.name}
                                </span>
                              ))}
                            </div>
                          )}
                          <p className="text-sm text-gray-400 mt-1">
                            Sent{" "}
                            {new Date(
                              request.requestTime.toDate()
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAcceptRequest(request.id)}
                          className="p-2.5 text-green-400 hover:text-green-300 hover:bg-green-500/10 
                                                           rounded-xl transition-all duration-200"
                          title="Accept Request"
                        >
                          <RiCheckLine size={20} />
                        </button>
                        <button
                          onClick={() => handleRejectRequest(request.id)}
                          className="p-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 
                                                           rounded-xl transition-all duration-200"
                          title="Decline Request"
                        >
                          <RiCloseLine size={20} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingRequests;
