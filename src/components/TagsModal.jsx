import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/authContext";
import { addUserTag, removeUserTag } from "../firebase/firestore";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/firestore";
import { AiFillTags, AiOutlineClose } from "react-icons/ai";

const TagsModal = ({ isOpen, onClose }) => {
  const [tagName, setTagName] = useState("");
  const [tagColor, setTagColor] = useState("#FF5733");
  const [userTags, setUserTags] = useState([]);
  const { currentUser } = useAuth();
  const [error, setError] = useState("");

  useEffect(() => {
    if (currentUser && isOpen) {
      const unsubscribe = onSnapshot(
        doc(db, "users", currentUser.uid),
        (doc) => {
          if (doc.exists()) {
            setUserTags(doc.data().tags || []);
          }
        }
      );

      return () => unsubscribe();
    }
  }, [currentUser, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (tagName.length > 5) {
      setError("Tag name must be 5 characters or less");
      return;
    }

    try {
      const newTag = {
        id: Date.now().toString(),
        name: tagName.toUpperCase(),
        color: tagColor,
      };
      await addUserTag(currentUser.uid, newTag);
      setTagName("");
      setError("");
    } catch (error) {
      setError(error.message);
    }
  };

  const handleDelete = async (tagId) => {
    try {
      await removeUserTag(currentUser.uid, tagId);
    } catch (error) {
      setError(error.message);
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
        className="max-w-[500px] w-full bg-[#020202] rounded-lg relative border border-[#272727] p-6
                   animate-scaleIn origin-top"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors duration-200"
        >
          <AiOutlineClose size={20} />
        </button>

        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <AiFillTags className="text-3xl text-white" />
            <div>
              <h2 className="text-2xl font-bold text-white">Manage Tags</h2>
              <p className="text-gray-400">Customize your profile tags</p>
            </div>
          </div>
          <p className="text-gray-400 mt-2">
            Add up to three tags to display on your profile. Each tag can be up
            to 5 characters long.
          </p>
        </div>

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-400 mb-2">Tag Name</label>
            <input
              type="text"
              value={tagName}
              onChange={(e) => setTagName(e.target.value)}
              placeholder="Enter tag name"
              maxLength={5}
              className="w-full bg-[#272727] border border-[#272727] text-white p-3 rounded-xl
                       focus:outline-none focus:border-white transition-all duration-300"
            />
          </div>

          <div>
            <label className="block text-gray-400 mb-2">Tag Color</label>
            <div className="flex items-center gap-8">
              {/* Color picker side */}
              <div className="flex flex-col items-center gap-2">
                <div className="relative">
                  <input
                    type="color"
                    value={tagColor}
                    onChange={(e) => setTagColor(e.target.value)}
                    className="w-14 h-14 rounded-xl bg-transparent cursor-pointer appearance-none border-2 border-[#272727] p-1 hover:border-white/20 transition-colors"
                  />
                  <div
                    className="absolute inset-0 rounded-xl pointer-events-none"
                    style={{ backgroundColor: tagColor }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: tagColor }}
                  />
                  <span className="text-gray-300 uppercase text-xs font-mono">
                    {tagColor}
                  </span>
                </div>
              </div>

              {/* Preview side */}
              <div className="flex items-center justify-center flex-1">
                <div
                  className="px-3 py-1.5 rounded-lg border-2 inline-flex items-center"
                  style={{ borderColor: tagColor, color: tagColor }}
                >
                  <span className="font-medium text-sm uppercase">
                    {tagName || "TAG"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!tagName}
              className="px-6 py-2 bg-white text-black font-medium rounded-xl hover:bg-opacity-90
                       transition-all duration-200 disabled:opacity-50 flex items-center gap-2 group w-full justify-center"
            >
              <span className="relative inline-block transform group-hover:translate-x-0.5 transition-transform duration-200">
                Add Tag
              </span>
            </button>
          </div>
        </form>

        <div className="mt-6 pt-6 border-t border-[#272727]">
          <h3 className="text-white font-medium mb-3">Current Tags</h3>
          <div className="flex flex-wrap gap-2">
            {userTags.map((tag) => (
              <div
                key={tag.id}
                className="group flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-200
                         hover:bg-opacity-10 hover:bg-white"
                style={{ borderColor: tag.color, color: tag.color }}
              >
                <span>{tag.name}</span>
                <button
                  onClick={() => handleDelete(tag.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TagsModal;
