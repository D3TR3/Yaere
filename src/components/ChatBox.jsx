import React, { useState, useEffect, useCallback, useRef } from "react";
import { IoSendOutline } from "react-icons/io5";
import { useAuth } from "../contexts/authContext";
import {
  sendMessage,
  markMessagesAsRead,
  addReaction,
  removeReaction,
  setTypingStatus,
  subscribeToTypingStatus,
} from "../firebase/firestore";
import { RiUserSearchLine, RiWechatLine, RiEmotionLine } from "react-icons/ri";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  where,
  getDocs,
  limit,
  doc,
  getDoc,
  startAfter,
  getDocsFromCache,
  getDocFromCache,
} from "firebase/firestore";
import { db, subscribeToFriendsList } from "../firebase/firestore";
import eventEmitter from "../utils/eventEmitter";

// Add debounce utility at the top
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

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

// Add this utility function near the top with other utilities
const convertUrlsToLinks = (text) => {
  const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/g;
  return text.split(urlRegex).map((part, i) => {
    if (!part) return null;
    if (part.match(urlRegex)) {
      const href = part.startsWith("www.") ? `https://${part}` : part;
      return (
        <a
          key={i}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 underline break-all"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

const ChatBox = () => {
  const { currentUser } = useAuth();
  // Remove duplicate users state declarations and merge them at the top
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [replyingTo, setReplyingTo] = useState(null);
  const [activeReactionMessage, setActiveReactionMessage] = useState(null);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isMessageCooldown, setIsMessageCooldown] = useState(false);
  const [friendIsTyping, setFriendIsTyping] = useState(false);

  // Refs
  const messagesEndRef = useRef(null);
  const unsubscribeFriendsRef = useRef(null);
  const lastMessageRef = useRef(null);
  const chatContainerRef = useRef(null);
  const activeListenersRef = useRef({});
  const lastUpdateRef = useRef({});
  const inputRef = useRef(null);
  const replyPreviewRef = useRef(null);
  const messageInputContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  // Constants
  const MESSAGES_PER_PAGE = 30;
  const CACHE_EXPIRATION = 5 * 60 * 1000; // 5 minutes

  const defaultProfilePic =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiM0QjU1NjMiLz48cGF0aCBkPSJNMTAwIDEwNUM4My4zMzE1IDEwNSA3MCAxMTguMzMyIDcwIDEzNVYxNDVIODVWMTM1Qzg1IDEyNi43MTYgOTEuNzE1NyAxMjAgMTAwIDEyMEMxMDguMjg0IDEyMCAxMTUgMTI2LjcxNiAxMTUgMTM1VjE0NUgxMzBWMTM1QzEzMCAxMTguMzMyIDExNi42NjkgMTA1IDEwMCAxMDVaTTEwMCA1NUM5MS43MTU3IDU1IDg1IDYxLjcxNTcgODUgNzBDODUgNzguMjg0MyA5MS43MTU3IDg1IDEwMCA4NUMxMDguMjg0IDg1IDExNSA3OC4yODQzIDExNSA3MEMxMTUgNjEuNzE1NyAxMDguMjg0IDU1IDEwMCA1NVoiIGZpbGw9IndoaXRlIi8+PC9zdmc+";

  // Move shouldUpdate into useCallback
  const shouldUpdate = useCallback(
    (key) => {
      const lastUpdate = lastUpdateRef.current[key];
      const now = Date.now();
      if (!lastUpdate || now - lastUpdate > CACHE_EXPIRATION) {
        lastUpdateRef.current[key] = now;
        return true;
      }
      return false;
    },
    [CACHE_EXPIRATION]
  ); // Add CACHE_EXPIRATION as dependency

  // Replace setupFriendsListener with cache-first approach
  const setupFriendsListener = useCallback(() => {
    if (!currentUser || activeListenersRef.current.friends) return;

    const setupMessageListener = (friendId) => {
      const chatId = [currentUser.uid, friendId].sort().join("_");
      const messagesRef = collection(db, `chats/${chatId}/messages`);
      const q = query(messagesRef, orderBy("timestamp", "desc"), limit(1));

      // Create unique key for this listener
      const listenerKey = `friend_messages_${friendId}`;

      // Only setup if not already listening
      if (!activeListenersRef.current[listenerKey]) {
        activeListenersRef.current[listenerKey] = onSnapshot(
          q,
          { includeMetadataChanges: true },
          async (messageSnap) => {
            if (!messageSnap.empty) {
              const lastMessage = messageSnap.docs[0].data();
              const hasUnread =
                lastMessage &&
                !lastMessage.read &&
                lastMessage.senderId !== currentUser.uid;

              // Update specific friend in list
              setFriends((prev) => {
                const updatedFriends = prev.map((f) => {
                  if (f.id === friendId) {
                    return {
                      ...f,
                      lastMessage: {
                        ...lastMessage,
                        timestamp: lastMessage.timestamp?.toDate(),
                        id: messageSnap.docs[0].id,
                      },
                      hasUnread,
                    };
                  }
                  return f;
                });
                // Sort friends by latest message
                return updatedFriends.sort((a, b) => {
                  const timeA = a.lastMessage?.timestamp || 0;
                  const timeB = b.lastMessage?.timestamp || 0;
                  return timeB - timeA;
                });
              });
            }
          }
        );
      }
    };

    // Main friends listener
    const friendsRef = collection(db, `users/${currentUser.uid}/friends`);
    const q = query(
      friendsRef,
      where("status", "==", "added"),
      limit(20) // Limit initial load
    );

    const processFriendsUpdate = debounce(async (snapshot) => {
      if (!shouldUpdate("friends")) return;

      try {
        const friendsPromises = snapshot.docs.map(async (docSnapshot) => {
          const friendId = docSnapshot.id;
          const friendDocRef = doc(db, "users", friendId);

          // Try to get friend data from cache first
          let friendDoc;
          try {
            friendDoc = await getDocFromCache(friendDocRef);
          } catch (e) {
            // If not in cache, get from server
            friendDoc = await getDoc(friendDocRef);
          }

          const friendData = friendDoc.data();

          // Try to get last message from cache first
          const chatId = [currentUser.uid, friendId].sort().join("_");
          const messagesRef = collection(db, `chats/${chatId}/messages`);
          const messagesQuery = query(
            messagesRef,
            orderBy("timestamp", "desc"),
            limit(1)
          );

          let messagesSnapshot;
          try {
            messagesSnapshot = await getDocsFromCache(messagesQuery);
          } catch (e) {
            // If not in cache, get from server
            messagesSnapshot = await getDocs(messagesQuery);
          }

          const lastMessage = messagesSnapshot.docs[0]?.data();
          const hasUnread =
            lastMessage &&
            !lastMessage.read &&
            lastMessage.senderId !== currentUser.uid;

          // Setup individual message listener for this friend
          setupMessageListener(friendId);

          return {
            id: friendId,
            ...friendData,
            status: docSnapshot.data().status,
            lastMessage: lastMessage
              ? {
                  ...lastMessage,
                  timestamp: lastMessage.timestamp?.toDate(),
                  id: messagesSnapshot.docs[0].id,
                }
              : null,
            hasUnread,
            lastActivity: lastMessage?.timestamp?.toDate() || new Date(0),
          };
        });

        const friendsList = await Promise.all(friendsPromises);
        const sortedFriends = friendsList.sort(
          (a, b) => b.lastActivity - a.lastActivity
        );
        setFriends(sortedFriends);
      } catch (error) {
        console.error("Error loading friends:", error);
      }
    }, 700);

    try {
      activeListenersRef.current.friends = onSnapshot(
        q,
        { includeMetadataChanges: true },
        processFriendsUpdate,
        (error) => {
          console.error("Friends listener error:", error);
        }
      );
    } catch (error) {
      console.error("Error setting up friends listener:", error);
    }
  }, [currentUser, shouldUpdate]); // Remove friends and selectedFriend from deps

  // Modify setupMessageListener to properly handle real-time updates
  const setupMessageListener = useCallback(() => {
    if (!selectedFriend || !currentUser) return;

    const chatId = [currentUser.uid, selectedFriend.id].sort().join("_");

    // Only setup new listener if one doesn't exist
    if (activeListenersRef.current[chatId]) {
      // Force immediate update but keep existing listener
      lastUpdateRef.current[chatId] = 0;
      return;
    }

    const messagesRef = collection(db, `chats/${chatId}/messages`);
    const q = query(
      messagesRef,
      orderBy("timestamp", "desc"),
      limit(MESSAGES_PER_PAGE)
    );

    const processMessageUpdate = debounce((snapshot) => {
      // Always process updates for active chat
      const newMessages = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate(),
        }))
        .reverse();

      setMessages(newMessages);
      if (snapshot.docs.length > 0) {
        lastMessageRef.current = snapshot.docs[snapshot.docs.length - 1];
      }

      markMessagesAsRead(chatId, currentUser.uid);
    });

    try {
      activeListenersRef.current[chatId] = onSnapshot(
        q,
        { includeMetadataChanges: true },
        processMessageUpdate,
        (error) => {
          console.error("Messages listener error:", error);
        }
      );
    } catch (error) {
      console.error("Error setting up message listener:", error);
    }
  }, [currentUser, selectedFriend]);

  // Modify setupGlobalMessageListeners to use debouncing
  const setupGlobalMessageListeners = useCallback(() => {
    if (!currentUser || !friends.length) return;

    const debouncedRefresh = debounce(() => {
      setupFriendsListener();
    }, 700);

    const unsubscribes = friends.map((friend) => {
      const chatId = [currentUser.uid, friend.id].sort().join("_");
      const messagesRef = collection(db, `chats/${chatId}/messages`);
      const q = query(messagesRef, orderBy("timestamp", "desc"), limit(1));

      try {
        return onSnapshot(
          q,
          { includeMetadataChanges: true },
          debouncedRefresh,
          (error) => {
            console.error("Global message listener error:", error);
          }
        );
      } catch (error) {
        console.error("Error setting up global message listener:", error);
        return null;
      }
    });

    // Clean up on unmount
    return () => {
      unsubscribes.forEach((unsub) => unsub && unsub());
    };
  }, [currentUser, friends, setupFriendsListener]);

  // Modify handleScroll for cache-first loading of older messages
  const handleScroll = useCallback(async () => {
    const container = chatContainerRef.current;
    if (!container || isLoadingMore || !hasMore || !lastMessageRef.current)
      return;

    if (container.scrollTop === 0) {
      setIsLoadingMore(true);
      const chatId = [currentUser.uid, selectedFriend.id].sort().join("_");
      const messagesRef = collection(db, `chats/${chatId}/messages`);

      try {
        const q = query(
          messagesRef,
          orderBy("timestamp", "desc"),
          startAfter(lastMessageRef.current),
          limit(MESSAGES_PER_PAGE)
        );

        // Try to get messages from cache first
        let snap;
        try {
          snap = await getDocsFromCache(q);
        } catch (e) {
          // If not in cache, get from server
          snap = await getDocs(q);
        }

        if (snap.empty) {
          setHasMore(false);
          return;
        }

        const oldMessages = snap.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate(),
          }))
          .reverse();

        lastMessageRef.current = snap.docs[snap.docs.length - 1];
        setMessages((prev) => [...oldMessages, ...prev]);

        const firstNewMessage = container.children[0];
        if (firstNewMessage) {
          container.scrollTop = firstNewMessage.offsetTop;
        }
      } catch (error) {
        console.error("Error loading more messages:", error);
      } finally {
        setIsLoadingMore(false);
      }
    }
  }, [currentUser, selectedFriend, isLoadingMore, hasMore]);

  // Update cleanup for message listener
  useEffect(() => {
    setupMessageListener();

    // Cleanup only when changing friends or unmounting
    return () => {
      if (selectedFriend) {
        const chatId = [currentUser.uid, selectedFriend.id].sort().join("_");
        if (activeListenersRef.current[chatId]) {
          activeListenersRef.current[chatId]();
          delete activeListenersRef.current[chatId];
        }
      }
    };
  }, [setupMessageListener, selectedFriend, currentUser]);

  useEffect(() => {
    if (currentUser) {
      setupFriendsListener();
    }

    // Store ref in variable for cleanup
    const currentUnsubscribe = unsubscribeFriendsRef.current;

    return () => {
      if (currentUnsubscribe) {
        currentUnsubscribe();
      }
    };
  }, [currentUser, setupFriendsListener]);

  // Add effect for global message listeners
  useEffect(() => {
    const cleanup = setupGlobalMessageListeners();
    return () => {
      if (cleanup) cleanup();
    };
  }, [setupGlobalMessageListeners]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Update the useEffect for marking messages as read - remove loadMessages
  useEffect(() => {
    const markAsRead = async () => {
      if (selectedFriend && currentUser) {
        const chatId = [currentUser.uid, selectedFriend.id].sort().join("_");
        await markMessagesAsRead(chatId, currentUser.uid);
      }
    };
    markAsRead();
  }, [selectedFriend, currentUser]); // Remove loadMessages from dependencies

  // Add this new useEffect to refresh friends list when messages change
  useEffect(() => {
    if (messages.length > 0 && currentUser) {
      setupFriendsListener();
    }
  }, [messages, currentUser, setupFriendsListener]);

  // Add scroll event listener
  useEffect(() => {
    const container = chatContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);

  // Replace handleTyping with this optimized version
  const handleTyping = useCallback((chatId, userId) => {
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      setTypingStatus(chatId, userId, true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      setTypingStatus(chatId, userId, false);
    }, 5000); // 5 seconds timeout
  }, []);

  // Update message input handler
  const handleMessageChange = (e) => {
    setMessage(e.target.value);
    if (selectedFriend && currentUser) {
      const chatId = [currentUser.uid, selectedFriend.id].sort().join("_");
      handleTyping(chatId, currentUser.uid);
    }
  };

  // Add cleanup for typing timeout
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      // Clear typing status when unmounting or changing friends
      if (currentUser && selectedFriend) {
        const chatId = [currentUser.uid, selectedFriend.id].sort().join("_");
        setTypingStatus(chatId, currentUser.uid, false);
      }
    };
  }, [currentUser, selectedFriend]);

  // Update handleSendMessage to handle offline capabilities
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !selectedFriend || isMessageCooldown) return;

    try {
      setIsMessageCooldown(true);
      const chatId = [currentUser.uid, selectedFriend.id].sort().join("_");

      // Clear typing status immediately when sending
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      isTypingRef.current = false;
      await setTypingStatus(chatId, currentUser.uid, false);

      await sendMessage(
        currentUser.uid,
        selectedFriend.id,
        message.trim(),
        replyingTo
      );
      setMessage("");
      setReplyingTo(null);

      // Force an immediate update by resetting the last update time
      lastUpdateRef.current[chatId] = 0;

      // Optionally, you can also force a friends list update
      lastUpdateRef.current["friends"] = 0;

      // Set cooldown timer
      setTimeout(() => {
        setIsMessageCooldown(false);
      }, 2000); // 2 seconds cooldown
    } catch (error) {
      setIsMessageCooldown(false); // Reset cooldown if error occurs
      if (!navigator.onLine) {
        console.log("Message will be sent when connection is restored");
      } else {
        console.error("Error sending message:", error);
      }
    }
  };

  // Add reply handler
  const handleReply = (message) => {
    setReplyingTo(message);
    // Focus the input field
    document.querySelector('input[type="text"]').focus();
  };

  // Add cancel reply handler
  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  // Replace handleBackdropClick with a useEffect for click handling
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        replyingTo &&
        messageInputContainerRef.current &&
        !messageInputContainerRef.current.contains(e.target)
      ) {
        setReplyingTo(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [replyingTo]);

  // Add reaction handler
  const handleReaction = async (message, reaction) => {
    const chatId = [currentUser.uid, selectedFriend.id].sort().join("_");
    try {
      if (message.reactions?.[currentUser.uid] === reaction) {
        await removeReaction(chatId, message.id, currentUser.uid);
      } else {
        await addReaction(chatId, message.id, reaction, currentUser.uid);
      }
      setActiveReactionMessage(null);
    } catch (error) {
      console.error("Error handling reaction:", error);
    }
  };

  // Add click outside handler for reaction panel
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (activeReactionMessage && !e.target.closest(".reaction-panel")) {
        setActiveReactionMessage(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activeReactionMessage]);

  const MessageBubble = ({ message, isLastMessage }) => {
    const isCurrentUser = message.senderId === currentUser.uid;
    const repliedMessage = message.replyTo
      ? messages.find((m) => m.id === message.replyTo.id)
      : null;
    const showReactionPanel = activeReactionMessage?.id === message.id;

    // Get reaction counts and emojis
    const getReactionEmoji = (type) => {
      switch (type) {
        case "love":
          return "❤️";
        case "haha":
          return "😂";
        case "sad":
          return "😢";
        case "like":
          return "👍";
        default:
          return "";
      }
    };

    const reactionCounts = message.reactions
      ? Object.values(message.reactions).reduce((acc, reaction) => {
          acc[reaction] = (acc[reaction] || 0) + 1;
          return acc;
        }, {})
      : {};

    return (
      <div
        className={`flex items-end gap-2 ${
          isCurrentUser ? "justify-end" : "justify-start"
        } 
                            mb-6 md:mb-4 w-full max-w-full px-2 md:px-0`}
      >
        {!isCurrentUser && (
          <div className="flex-shrink-0">
            <img
              src={selectedFriend.photoURL || defaultProfilePic}
              alt="Profile"
              className="w-6 h-6 rounded-full object-cover mb-1"
            />
          </div>
        )}
        <div className="relative min-w-0 max-w-[70%] md:max-w-[85%] group">
          {/* Action buttons container - Updated to only show on bubble hover */}
          <div
            className={`absolute top-1/2 -translate-y-1/2 flex gap-1
                                 opacity-0 group-hover:opacity-100 transition-all duration-200
                                 ${
                                   isCurrentUser
                                     ? "right-full -translate-x-1"
                                     : "left-full translate-x-1"
                                 }`}
          >
            {/* Reply button */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleReply(message);
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="p-1.5 rounded-full bg-[#272727] hover:bg-[#323232] 
                                     transition-all duration-200 hover:scale-110 active:scale-95"
            >
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                />
              </svg>
            </button>
            {/* Reaction button - Updated to use icon */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActiveReactionMessage(
                  activeReactionMessage?.id === message.id ? null : message
                );
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="p-1.5 rounded-full bg-[#272727] hover:bg-[#323232] 
                                     transition-all duration-200 hover:scale-110 active:scale-95"
            >
              <RiEmotionLine className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Message content */}
          <div
            className={`relative px-3 md:px-4 py-2 md:py-2.5 rounded-2xl transform transition-all duration-200
                        ${
                          isCurrentUser
                            ? "bg-white text-black rounded-br-sm hover:bg-opacity-90"
                            : "bg-[#272727] text-white rounded-bl-sm hover:bg-[#323232]"
                        }
                        shadow-lg w-full break-words`}
          >
            {repliedMessage && (
              <div
                className={`text-sm mb-2 pb-2 border-b ${
                  isCurrentUser ? "border-gray-300" : "border-gray-600"
                }
                                        overflow-hidden`}
              >
                <p
                  className={`font-medium ${
                    isCurrentUser ? "text-gray-600" : "text-gray-400"
                  }
                                          text-ellipsis overflow-hidden`}
                >
                  {repliedMessage.senderId === currentUser.uid
                    ? "You"
                    : selectedFriend.displayName}
                </p>
                <p className="truncate opacity-75 max-w-full">
                  {repliedMessage.text}
                </p>
              </div>
            )}
            <div className="space-y-1">
              <p className="leading-relaxed whitespace-pre-wrap text-[15px] break-words overflow-hidden">
                {convertUrlsToLinks(message.text)}
              </p>
              <p
                className={`text-[11px] text-right ${
                  isCurrentUser ? "text-gray-600" : "text-gray-400"
                }`}
              >
                {message.timestamp?.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>

            {/* Updated Reactions display with higher z-index */}
            {Object.keys(reactionCounts).length > 0 && (
              <div
                className={`absolute -bottom-2 flex items-center gap-0.5 
                                         bg-[#1A1A1A] px-2 py-1 rounded-full 
                                         border border-[#333333] shadow-lg
                                         transform transition-all duration-200 
                                         hover:scale-110 hover:translate-y-0.5
                                         
                                         ${
                                           isCurrentUser
                                             ? "-left-2"
                                             : "-right-2"
                                         }`}
              >
                {Object.entries(reactionCounts).map(([reaction, count]) => (
                  <div
                    key={reaction}
                    className="flex items-center gap-0.5 transition-all duration-200 hover:scale-110"
                  >
                    <span className="text-base">
                      {getReactionEmoji(reaction)}
                    </span>
                    {count > 1 && (
                      <span className="text-xs text-gray-400">{count}</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Updated Reaction panel */}
            {showReactionPanel && (
              <>
                {/* Removed backdrop */}
                <div
                  className={`absolute w-auto
                                           ${
                                             isCurrentUser
                                               ? "right-0"
                                               : "left-0"
                                           }
                                           bottom-full mb-2
                                           transform transition-all duration-200 z-50`}
                >
                  <div
                    className="reaction-panel bg-[#1A1A1A] rounded-lg 
                                                shadow-xl border border-[#333333] 
                                                flex items-center justify-center gap-1 p-1.5
                                                scale-100 hover:scale-105 mx-auto
                                                transition-all duration-200 animate-fade-in
                                                relative"
                  >
                    {[
                      { emoji: "❤️", name: "love" },
                      { emoji: "😂", name: "haha" },
                      { emoji: "😢", name: "sad" },
                      { emoji: "👍", name: "like" },
                    ].map((reaction) => (
                      <button
                        key={reaction.name}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleReaction(message, reaction.name);
                        }}
                        onTouchStart={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        className={`p-2 md:p-1.5 hover:bg-[#272727]/80 rounded-lg
                                                          transition-all duration-200 
                                                          hover:scale-125 active:scale-95
                                                          ${
                                                            message.reactions?.[
                                                              currentUser.uid
                                                            ] === reaction.name
                                                              ? "bg-[#272727] scale-110"
                                                              : "hover:bg-opacity-50"
                                                          }`}
                      >
                        <span className="text-xl md:text-lg">
                          {reaction.emoji}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Update MessageStatus component
  const MessageStatus = () => {
    if (!messages.length && !friendIsTyping) return null;

    return (
      <div className="px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Typing indicator - left aligned */}
          <div className="flex items-center">
            {friendIsTyping && (
              <div className="flex items-center gap-2">
                <img
                  src={selectedFriend?.photoURL || defaultProfilePic}
                  alt="Profile"
                  className="w-4 h-4 rounded-full object-cover"
                />
                <div className="bg-[#272727] rounded-xl px-3 py-1 inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-typing-dot1"></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-typing-dot2"></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-typing-dot3"></span>
                </div>
              </div>
            )}
          </div>

          {/* Read/Sent status - right aligned */}
          {messages.length > 0 &&
            messages[messages.length - 1].senderId === currentUser.uid && (
              <div className="flex items-center">
                <p
                  className={`text-xs ${
                    messages[messages.length - 1].read
                      ? "text-white"
                      : "text-gray-400"
                  }`}
                >
                  {messages[messages.length - 1].read ? "Read" : "Sent"}
                </p>
              </div>
            )}
        </div>
      </div>
    );
  };

  const EmptyStateMessage = () => (
    <div className="flex-1 hidden md:flex items-center justify-center text-gray-400 p-4 text-center">
      <div className="flex flex-col items-center space-y-4">
        <RiUserSearchLine className="text-6xl opacity-50" />
        <p className="text-xl">
          {friends.length === 0
            ? "Add a friend to start chatting"
            : "Select a friend to start chatting"}
        </p>
      </div>
    </div>
  );

  const swipeThreshold = 100; // minimum distance for swipe

  // Add these new handlers
  const handleTouchStart = (e) => {
    // Only track touch start if we're touching the container itself
    if (e.target === e.currentTarget) {
      setTouchEnd(null);
      setTouchStart(e.targetTouches[0].clientX);
    }
  };

  const handleTouchMove = (e) => {
    // Only track movement if we started touching the container
    if (touchStart) {
      setTouchEnd(e.targetTouches[0].clientX);
    }
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance < -swipeThreshold;

    if (isLeftSwipe && selectedFriend) {
      setSelectedFriend(null);
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  // Add cleanup when changing friends
  useEffect(() => {
    return () => {
      Object.keys(activeListenersRef.current).forEach((key) => {
        if (key !== "friends" && activeListenersRef.current[key]) {
          activeListenersRef.current[key]();
          delete activeListenersRef.current[key];
        }
      });
    };
  }, [selectedFriend]);

  // Cleanup all listeners on unmount
  useEffect(() => {
    return () => {
      Object.values(activeListenersRef.current).forEach((unsubscribe) => {
        if (unsubscribe) unsubscribe();
      });
      activeListenersRef.current = {};
    };
  }, []);

  // Add ReplyPreview component
  const ReplyPreview = () => {
    if (!replyingTo) return null;

    return (
      <div
        ref={replyPreviewRef}
        className="flex items-center gap-3 px-4 py-3 bg-[#1A1A1A] rounded-2xl overflow-hidden mb-2
                      border border-[#333333]"
      >
        <div className="flex-1 min-w-0 overflow-hidden">
          <p className="text-white/90 text-sm font-medium truncate">
            Replying to{" "}
            {replyingTo.senderId === currentUser.uid
              ? "yourself"
              : selectedFriend.displayName}
          </p>
          <p className="text-gray-500 text-sm truncate max-w-full">
            {replyingTo.text}
          </p>
        </div>
        <button
          onClick={handleCancelReply}
          className="p-1.5 rounded-full hover:bg-[#272727] transition-colors flex-shrink-0
                          text-gray-500 hover:text-gray-400"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    );
  };

  useEffect(() => {
    // Listen for friends list updates
    const handleFriendsUpdate = (data) => {
      // Check if data is an array (from AllFriends component)
      if (Array.isArray(data)) {
        setFriends(data);
      }
      // Check if data is an object with action and users (from remove/add operations)
      else if (data?.action) {
        if (data.action === "remove") {
          setFriends((prev) =>
            prev.filter(
              (friend) => !data.users.some((user) => user.id === friend.id)
            )
          );
          // If the removed friend was selected, clear selection
          if (
            selectedFriend &&
            data.users.some((user) => user.id === selectedFriend.id)
          ) {
            setSelectedFriend(null);
          }
        } else if (data.action === "add") {
          // Add new friend to the list if they're not already there
          const newFriend = data.users.find(
            (user) => user.id !== currentUser.uid
          );
          if (newFriend) {
            setFriends((prev) => {
              if (!prev.some((friend) => friend.id === newFriend.id)) {
                return [...prev, { ...newFriend, status: "added" }];
              }
              return prev;
            });
          }
        }
      }
    };

    eventEmitter.on("friendsListUpdate", handleFriendsUpdate);

    return () => {
      eventEmitter.off("friendsListUpdate", handleFriendsUpdate);
    };
  }, [currentUser?.uid, selectedFriend]);

  useEffect(() => {
    let unsubscribe;
    if (currentUser) {
      unsubscribe = subscribeToFriendsList(
        currentUser.uid,
        (friendsList, changes) => {
          // Update friends list
          setFriends(friendsList);

          // Handle removals - if the selected friend was removed, clear selection
          changes.forEach((change) => {
            if (change.type === "removed" && selectedFriend?.id === change.id) {
              setSelectedFriend(null);
            }
          });
        }
      );
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentUser, selectedFriend?.id]);

  // Add typing status listener
  useEffect(() => {
    if (selectedFriend && currentUser) {
      const chatId = [currentUser.uid, selectedFriend.id].sort().join("_");
      const unsubscribe = subscribeToTypingStatus(
        chatId,
        currentUser.uid,
        (isTyping) => {
          setFriendIsTyping(isTyping);
        }
      );

      return () => {
        unsubscribe();
        // Clear typing status when unmounting
        if (currentUser && selectedFriend) {
          handleTyping(chatId, currentUser.uid, false);
        }
      };
    }
  }, [selectedFriend, currentUser, handleTyping]);

  return (
    <div
      className="fixed inset-x-0 bottom-0 top-24 md:static md:inset-auto flex flex-col md:flex-row md:h-[750px] 
                    w-full max-w-[1400px] mx-auto bg-[#020202] border border-[#272727] md:mt-4 md:rounded-lg 
                    overflow-hidden z-20"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: "pan-y pinch-zoom" }}
    >
      {/* Simplified sidebar with only friends list */}
      <div
        className={`w-full md:w-[350px] h-full flex flex-col border-b md:border-b-0 md:border-r 
                        border-[#272727] ${selectedFriend && "hidden md:flex"}`}
      >
        <div className="p-4 border-b border-[#272727] backdrop-blur bg-[#020202]/80 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-bold text-xl">Messages</h2>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#272727] scrollbar-track-transparent">
          <div className="space-y-1 p-2">
            {friends.map((friend) => (
              <div
                key={friend.id}
                onClick={() => setSelectedFriend(friend)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200
                                    hover:bg-[#272727] group relative cursor-pointer
                                    ${
                                      selectedFriend?.id === friend.id
                                        ? "bg-[#272727]"
                                        : ""
                                    }`}
              >
                <img
                  src={friend.photoURL || defaultProfilePic}
                  alt={friend.displayName}
                  className="w-12 h-12 rounded-full object-cover border-2 border-gray-600 
                                             group-hover:border-white transition-all duration-200"
                />
                <div className="text-left flex-1 min-w-0">
                  <p
                    className="text-white font-medium transition-all duration-200 
                                              group-hover:translate-x-1"
                  >
                    {friend.displayName}
                  </p>
                  <p className="text-gray-400 text-sm truncate">
                    {friend.lastMessage?.text || "No messages yet"}
                  </p>
                </div>
                {friend.hasUnread && (
                  <div className="w-3 h-3 bg-white rounded-full" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chat area - updated structure */}
      <div className="flex-1 flex flex-col min-w-0 relative h-full">
        {selectedFriend ? (
          <>
            {/* Chat container with transform */}
            <div
              className="absolute inset-0 flex flex-col"
              style={{
                transform:
                  touchStart && touchEnd
                    ? `translateX(${Math.min(
                        Math.max(touchEnd - touchStart, 0),
                        200
                      )}px)`
                    : "translateX(0)",
                transition: touchStart ? "none" : "transform 0.3s ease-out",
              }}
            >
              {/* Fixed Header */}
              <div className="absolute top-0 left-0 right-0 z-20 bg-[#020202] border-b border-[#272727]">
                <div className="p-4 flex items-center gap-4">
                  <button
                    onClick={() => setSelectedFriend(null)}
                    className="text-white hover:bg-[#272727] p-2 rounded-lg transition-all duration-200 
                                            active:scale-95 md:hidden"
                  >
                    <span className="text-xl">←</span>
                  </button>
                  <div className="flex items-center gap-3 group">
                    <div className="relative">
                      <img
                        src={selectedFriend.photoURL || defaultProfilePic}
                        alt={selectedFriend.displayName}
                        className="w-10 h-10 rounded-full object-cover border-2 border-[#272727] 
                                                    transition-all duration-300 group-hover:border-gray-500"
                      />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">
                        {selectedFriend.displayName}
                      </h3>
                      {selectedFriend.tags &&
                        selectedFriend.tags.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {selectedFriend.tags.map((tag) => (
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
                </div>
              </div>

              {/* Messages Area */}
              <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#272727] scrollbar-track-transparent 
                                    p-1 md:p-4 space-y-1 max-w-full absolute inset-0 
                                    pt-[72px] pb-[160px] md:pb-[140px]"
              >
                {isLoadingMore && (
                  <div className="text-center text-gray-400 py-2">
                    Loading more messages...
                  </div>
                )}
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full space-y-4 text-gray-400">
                    <img
                      src={selectedFriend.photoURL || defaultProfilePic}
                      alt="Profile"
                      className="w-20 h-20 rounded-full object-cover border-2 border-[#272727] opacity-50"
                    />
                    <p className="text-lg">
                      No messages yet with {selectedFriend.displayName}
                    </p>
                    <p className="text-sm flex items-center gap-2">
                      Say hello!{" "}
                      <RiWechatLine className="text-lg animate-bounce" />
                    </p>
                  </div>
                ) : (
                  <>
                    {messages.map((msg, index) => (
                      <MessageBubble
                        key={msg.id}
                        message={msg}
                        isLastMessage={index === messages.length - 1}
                      />
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Fixed Input Container */}
              <div className="absolute bottom-0 left-0 right-0 z-20 bg-[#020202] border-t border-[#272727]">
                <MessageStatus />
                <div
                  ref={messageInputContainerRef}
                  className="p-2 md:p-4 pb-8 md:pb-6" // Added bottom padding
                >
                  <ReplyPreview />
                  <form
                    onSubmit={handleSendMessage}
                    className="flex gap-2 max-w-full"
                  >
                    <input
                      ref={inputRef}
                      type="text"
                      value={message}
                      onChange={handleMessageChange}
                      placeholder="Type a message..."
                      className="flex-1 bg-[#272727] text-white rounded-xl px-4 py-2.5
                                                focus:outline-none focus:ring-2 focus:ring-white/20 
                                                transition-all duration-200 min-w-0 max-w-full"
                    />
                    <button
                      type="submit"
                      disabled={!message.trim() || isMessageCooldown}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSendMessage(e);
                      }}
                      onTouchStart={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      className={`p-2.5 text-gray-400 hover:bg-[#272727] rounded-xl transition-all duration-200
                                                disabled:opacity-50 disabled:hover:bg-transparent active:scale-95
                                                enabled:hover:text-white min-w-[44px] min-h-[44px]
                                                flex items-center justify-center
                                                ${
                                                  isMessageCooldown
                                                    ? "cursor-not-allowed opacity-50"
                                                    : ""
                                                }`}
                      title={
                        isMessageCooldown
                          ? "Please wait before sending another message"
                          : ""
                      }
                    >
                      <IoSendOutline size={20} />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </>
        ) : (
          <EmptyStateMessage />
        )}
      </div>
    </div>
  );
};

export default ChatBox;
