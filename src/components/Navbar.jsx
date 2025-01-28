import React, { useState, useRef, useEffect } from 'react';
import { AiOutlineMenu, AiOutlineClose } from 'react-icons/ai';
import { CgProfile } from 'react-icons/cg';
import { IoSettingsOutline } from 'react-icons/io5';
import { FiLogOut } from 'react-icons/fi';
import { IoMdArrowDropdown } from 'react-icons/io';
import { RiUserSearchLine, RiUserSharedLine, RiUserAddLine, RiShareForwardLine } from 'react-icons/ri';
import { useAuth } from '../contexts/authContext';
import ProfileDialog from './ProfileDialog';
import FindFriends from './FindFriends';
import PendingRequests from './PendingRequests';
import AllFriends from './AllFriends';
import OutgoingRequests from './OutgoingRequests';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/firestore';
import { HiOutlineHome } from 'react-icons/hi';
import { BiInfoCircle, BiSupport} from 'react-icons/bi';

const Navbar = ({ setShowSignUp, setShowSignIn, onRefreshChat }) => {
    // State for managing mobile menu and profile dropdown
    const [nav, setNav] = useState(true); // true = closed, false = open
    const [showMenu, setShowMenu] = useState(false);
    const [showProfileDialog, setShowProfileDialog] = useState(false);
    const [showFriendsMenu, setShowFriendsMenu] = useState(false);
    const [showFindFriends, setShowFindFriends] = useState(false);
    const [showPendingRequests, setShowPendingRequests] = useState(false);
    const [showAllFriends, setShowAllFriends] = useState(false);
    const [showOutgoingRequests, setShowOutgoingRequests] = useState(false);
    const menuRef = useRef(null);
    const friendsMenuRef = useRef(null);
    const [userData, setUserData] = useState(null);

    // Get authentication related values from context
    const { userSignedIn, currentUser, handleSignOut } = useAuth();

    // Handler for clicking outside menus
    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            setNav(true);  // Close mobile menu
            setShowMenu(false);  // Close profile menu
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Add another useEffect for friends menu click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (friendsMenuRef.current && !friendsMenuRef.current.contains(event.target)) {
                setShowFriendsMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Add this useEffect to fetch Firestore user data
    useEffect(() => {
        const fetchUserData = async () => {
            if (currentUser) {
                const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
                if (userDoc.exists()) {
                    setUserData(userDoc.data());
                }
            } else {
                setUserData(null);
            }
        };
        fetchUserData();
    }, [currentUser]);

    // Default profile picture (gray avatar) - used when user has no photo
    const defaultProfilePic = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiM0QjU1NjMiLz48cGF0aCBkPSJNMTAwIDEwNUM4My4zMzE1IDEwNSA3MCAxMTguMzMyIDcwIDEzNVYxNDVIODVWMTM1Qzg1IDEyNi43MTYgOTEuNzE1NyAxMjAgMTAwIDEyMEMxMDguMjg0IDEyMCAxMTUgMTI2LjcxNiAxMTUgMTM1VjE0NUgxMzBWMTM1QzEzMCAxMTguMzMyIDExNi42NjkgMTA1IDEwMCAxMDVaTTEwMCA1NUM5MS43MTU3IDU1IDg1IDYxLjcxNTcgODUgNzBDODUgNzguMjg0MyA5MS43MTU3IDg1IDEwMCA4NUMxMDguMjg0IDg1IDExNSA3OC4yODQzIDExNSA3MEMxMTUgNjEuNzE1NyAxMDguMjg0IDU1IDEwMCA1NVoiIGZpbGw9IndoaXRlIi8+PC9zdmc+";

    // Toggle mobile menu
    const handleNav = () => {
        setNav(!nav);
    }

    // Get user's profile picture or use default
    const profilePic = userData?.photoURL || defaultProfilePic;

    // Modify getUserDisplayName to use userData instead of currentUser
    const getUserDisplayName = () => {
        if (userData?.displayName) {
            return userData.displayName;
        }
        return currentUser?.email;
    };

    // Component for desktop profile menu with descriptions
    const ProfileMenuDesktop = () => (
        <div className="relative m-auto pl-12" ref={menuRef}>
            {/* Profile Picture Button */}
            <div
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-3 cursor-pointer group"
            >
                <img
                    src={profilePic}
                    alt="Profile"
                    className="w-12 h-12 rounded-full object-cover border-2 border-[#272727] transition-all duration-300
                             group-hover:border-gray-500 transform group-hover:scale-105"
                />
            </div>

            {showMenu && (
                <div className="absolute right-0 md:w-80 w-64 bg-[#020202] border border-[#272727] rounded-xl 
                               shadow-2xl z-50 animate-fadeUp origin-top-right"
                    style={{ maxWidth: 'calc(100vw - 2rem)' }}
                >
                    <div className="p-4 border-b border-[#272727]">
                        <p className="text-white font-medium text-base">
                            {getUserDisplayName()}
                        </p>
                        <p className="text-gray-400 text-sm mt-0.5 font-light">
                            {currentUser?.email}
                        </p>
                    </div>
                    <div className="p-2">
                        {userMenuItems.map((item, index) => (
                            <button
                                key={index}
                                onClick={item.onClick}
                                disabled={item.disabled}
                                className={`w-full text-left px-3 py-2.5 rounded-lg
                                         flex items-center gap-3 group
                                         ${item.disabled 
                                            ? 'text-gray-500 cursor-not-allowed' 
                                            : 'text-gray-300 hover:text-white hover:bg-[#272727]'}
                                         transition-all duration-200
                                         ${item.className || ''}`}
                            >
                                <span className={`transform transition-transform duration-200 
                                                ${!item.disabled && 'group-hover:translate-x-1'}`}>
                                    {item.icon}
                                </span>
                                <div className="flex-1">
                                    <div>{item.text}</div>
                                    <div className="text-sm text-gray-400">{item.description}</div>
                                </div>
                            </button>
                        ))}
                        <div className="h-[1px] bg-[#272727] my-2"></div>
                        <button
                            onClick={() => {
                                handleSignOut();
                                setShowMenu(false);
                            }}
                            className="w-full text-left px-3 py-3 text-red-400 hover:text-red-300 rounded-lg
                                     hover:bg-red-950/30 transition-all duration-200 flex items-center gap-3
                                     group"
                        >
                            <span className="transform transition-transform duration-200 group-hover:translate-x-1 flex-shrink-0">
                                <FiLogOut className="text-xl" />
                            </span>
                            <div className="flex-1 min-w-0">
                                <div className="truncate">Sign Out</div>
                                <div className="text-sm text-red-400/70 truncate">End your current session</div>
                            </div>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );

    // Update Navigation Items for non-authenticated users - add Contact
    const publicNavItems = [
        { 
            title: 'Home', 
            icon: <HiOutlineHome className="text-xl" />, 
            description: 'Back to homepage',
            onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' })
        },
        { 
            title: 'About', 
            icon: <BiInfoCircle className="text-xl" />, 
            description: 'Learn about us',
            onClick: () => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })
        },
        { 
            title: 'Contact', 
            icon: <BiSupport className="text-xl" />, 
            description: 'Get in touch',
            onClick: () => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
        }
    ];

    // Friends menu items
    const friendsMenuItems = [
        { 
            title: 'All Friends', 
            description: 'View and manage your friends',
            onClick: () => {
                setShowAllFriends(true);
                setShowFriendsMenu(false);
                setNav(true); // For mobile menu
            }, 
            icon: <RiUserSharedLine className="text-2xl" /> 
        },
        { 
            title: 'Find Friends', 
            description: 'Search for new friends',
            onClick: () => {
                setShowFindFriends(true);
                setShowFriendsMenu(false);
                setNav(true); // For mobile menu
            }, 
            icon: <RiUserSearchLine className="text-2xl" /> 
        },
        { 
            title: 'Pending Requests', 
            description: 'Manage incoming requests',
            onClick: () => {
                setShowPendingRequests(true);
                setShowFriendsMenu(false);
                setNav(true); // For mobile menu
            }, 
            icon: <RiUserAddLine className="text-2xl" /> 
        },
        { 
            title: 'Outgoing Requests', 
            description: 'View sent friend requests',
            onClick: () => {
                setShowOutgoingRequests(true);
                setShowFriendsMenu(false);
                setNav(true); // For mobile menu
            }, 
            icon: <RiShareForwardLine className="text-2xl" /> 
        }
    ];

    // Updated friends menu item rendering in FriendsNavItem
    const FriendsNavItem = () => (
        <div className="relative" ref={friendsMenuRef}>
            <button
                onClick={() => setShowFriendsMenu(!showFriendsMenu)}
                className="flex items-center gap-2 p-4 cursor-pointer relative group"
            >
                <RiUserSharedLine className="text-xl transform transition-all duration-200 group-hover:scale-110" />
                <span className="relative transform transition-all duration-200 group-hover:translate-x-0.5">Friends</span>
                <IoMdArrowDropdown
                    className={`text-xl transition-all duration-300 ${showFriendsMenu ? 'rotate-180' : ''
                        } group-hover:translate-y-0.5`}
                />
            </button>

            {showFriendsMenu && (
                <div className="absolute top-full right-0 md:w-80 w-64 bg-[#020202] border border-[#272727] rounded-xl 
                               shadow-2xl z-50 animate-fadeUp origin-top-right"
                    style={{ maxWidth: 'calc(100vw - 2rem)' }}
                >
                    <div className="p-4 border-b border-[#272727]">
                        <h3 className="text-white font-medium">Friends Menu</h3>
                        <p className="text-gray-400 text-sm mt-1">Manage your connections</p>
                    </div>
                    <div className="p-2">
                        {friendsMenuItems.map((item, index) => (
                            <button
                                key={index}
                                onClick={item.onClick}
                                className="w-full text-left px-3 py-3 text-gray-300 hover:text-white rounded-lg
                                         hover:bg-[#272727] transition-all duration-200 flex items-center gap-3
                                         group"
                            >
                                <span className="transform transition-transform duration-200 group-hover:translate-x-1 flex-shrink-0">
                                    {item.icon}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <div className="truncate font-medium">{item.title}</div>
                                    <div className="text-sm text-gray-400 truncate">{item.description}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    // Updated user menu items with descriptions
    const userMenuItems = [
        {
            icon: <CgProfile className="text-2xl" />,
            text: 'Profile',
            description: 'View and edit your profile',
            onClick: () => {
                setShowProfileDialog(true);
                setNav(true);
            }
        },
        { 
            icon: <IoSettingsOutline className="text-2xl" />, 
            text: 'Settings',
            description: 'Coming soon',
            disabled: true 
        },
        { 
            icon: <BiSupport className="text-2xl" />, 
            text: 'Contact',
            description: 'Coming soon',
            disabled: true 
        }
    ];

    // Add sign out button to mobile menu
    const MobileSignOutButton = () => (
        <button
            onClick={() => {
                handleSignOut();
                setNav(true);
            }}
            className="w-full flex items-center gap-3 p-4 text-red-400 hover:text-red-300
                     hover:bg-red-500/10 rounded-xl transition-all duration-200 group mt-4"
        >
            <span className="text-2xl transform transition-transform duration-200 
                         group-hover:scale-110">
                <FiLogOut />
            </span>
            <div className="text-left">
                <div className="font-medium">Sign Out</div>
                <div className="text-sm text-red-400/70">End your current session</div>
            </div>
        </button>
    );

    return (
        <>
            <div className='fixed top-0 inset-x-0 z-50 bg-[#020202] border-b border-[#272727]'>
                <div className='flex justify-between items-center h-24 max-w-[1240px] mx-auto px-4 text-white border-x border-[#272727]'>
                    <h1 className='text-3xl font-bold text-white tracking-wider'>
                        YAERE
                        <span className="text-xs ml-2 text-gray-400">BETA</span>
                    </h1>

                    {/* Desktop Navigation */}
                    <ul className='hidden md:flex items-center gap-4'>
                        {userSignedIn ? (
                            <>
                                <FriendsNavItem />
                                <ProfileMenuDesktop />
                            </>
                        ) : (
                            <>
                                {publicNavItems.map((item, index) => (
                                    <li key={index} 
                                        className='relative group'
                                    >
                                        <button 
                                            onClick={item.onClick}
                                            className='p-3 flex items-center gap-2 text-gray-300 hover:text-white
                                                     transition-all duration-300'
                                        >
                                            <span className="text-lg transform group-hover:scale-110 transition-transform duration-200">
                                                {item.icon}
                                            </span>
                                            <span className="relative">
                                                {item.title}
                                                <span className='absolute bottom-0 left-0 w-0 h-[2px] bg-white 
                                                             group-hover:w-full transition-all duration-300'></span>
                                            </span>
                                        </button>
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-max opacity-0 invisible
                                                    group-hover:opacity-100 group-hover:visible transition-all duration-200
                                                    pointer-events-none bg-[#272727] text-sm text-gray-300 px-3 py-1.5 
                                                    rounded-md -mt-1">
                                            {item.description}
                                        </div>
                                    </li>
                                ))}
                                <div className="flex items-center gap-3 ml-4 scale-100 whitespace-nowrap">
                                    <button
                                        onClick={() => setShowSignIn(true)}
                                        className='px-6 py-2 text-white border border-white/20 rounded-xl
                                                 hover:border-white transition-all duration-300 hover:scale-105
                                                 active:scale-95 backdrop-blur-sm'
                                    >
                                        Sign In
                                    </button>
                                    <button
                                        onClick={() => setShowSignUp(true)}
                                        className='px-6 py-2 bg-white text-black rounded-xl hover:bg-opacity-90
                                                 transition-all duration-300 transform hover:scale-105
                                                 active:scale-95 font-medium hover:shadow-lg'
                                    >
                                        Sign Up
                                    </button>
                                </div>
                            </>
                        )}
                    </ul>

                    {/* Mobile Navigation */}
                    <div className='md:hidden'>
                        <button
                            onClick={handleNav}
                            className="p-2 hover:bg-[#272727] rounded-lg transition-colors duration-200"
                        >
                            <AiOutlineMenu size={24} />
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                <div className={`fixed inset-0 backdrop-blur-sm bg-black/50 z-[60] transition-all duration-300 
                             ${nav ? 'opacity-0 pointer-events-none' : 'opacity-100'}`} 
                     onClick={handleBackdropClick}>
                    <div className={`fixed left-0 top-0 w-[80%] max-w-[400px] h-full border-r border-[#272727] 
                                 bg-[#020202] transform transition-all duration-300 ease-out
                                 ${nav ? '-translate-x-full' : 'translate-x-0'}`}
                        onClick={e => e.stopPropagation()}
                    >
                        {!userSignedIn ? (
                            <div className="h-full flex flex-col">
                                {/* Header */}
                                <div className="flex items-center justify-between p-6 border-b border-[#272727]">
                                    <h1 className='text-2xl font-bold text-white tracking-wider'>
                                        YAERE
                                        <span className="text-xs ml-2 text-gray-400">BETA</span>
                                    </h1>
                                    <button
                                        onClick={() => setNav(true)}
                                        className="p-2 text-white hover:bg-[#272727] rounded-lg transition-colors duration-200"
                                    >
                                        <AiOutlineClose size={20} />
                                    </button>
                                </div>

                                {/* Navigation Items - Scrollable Area */}
                                <div className="flex-1 overflow-y-auto">
                                    <div className="p-4 space-y-4">
                                        {publicNavItems.map((item, index) => (
                                            <button 
                                                key={index}
                                                onClick={() => {
                                                    item.onClick();
                                                    setNav(true); // Close mobile menu after clicking
                                                }}
                                                className='w-full flex items-center gap-3 p-4 text-gray-300 hover:text-white
                                                         hover:bg-[#272727] rounded-xl transition-all duration-200 group'
                                            >
                                                <span className="text-2xl transform transition-transform duration-200 
                                                             group-hover:scale-110">{item.icon}</span>
                                                <div className="text-left">
                                                    <div className="font-medium">{item.title}</div>
                                                    <div className="text-sm text-gray-400">{item.description}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Auth Buttons - Fixed at Bottom */}
                                <div className="sticky bottom-0 border-t border-[#272727] p-4 pb-8 space-y-3 bg-[#020202] mt-auto">
                                    <button
                                        onClick={() => {
                                            setNav(true);
                                            setShowSignUp(true);
                                        }}
                                        className='w-full bg-white text-black font-medium py-3 rounded-xl
                                                 hover:bg-opacity-90 transition-all duration-200'
                                    >
                                        Create Account
                                    </button>
                                    <button
                                        onClick={() => {
                                            setNav(true);
                                            setShowSignIn(true);
                                        }}
                                        className='w-full border border-white/20 text-white font-medium py-3 rounded-xl
                                                 hover:bg-white/10 transition-all duration-200'
                                    >
                                        Sign In
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col">
                                {/* Fixed Header */}
                                <div className="flex items-center justify-between p-6 border-b border-[#272727]">
                                    <h1 className='text-2xl font-bold text-white tracking-wider'>
                                        YAERE
                                        <span className="text-xs ml-2 text-gray-400">BETA</span>
                                    </h1>
                                    <button
                                        onClick={() => setNav(true)}
                                        className="p-2 text-white hover:bg-[#272727] rounded-lg transition-colors duration-200"
                                    >
                                        <AiOutlineClose size={20} />
                                    </button>
                                </div>

                                {/* Scrollable Content */}
                                <div className="flex-1 overflow-y-auto">
                                    {/* Friends Menu Section - Now First */}
                                    <div className="p-6 border-b border-[#272727]">
                                        <h3 className="text-xl font-bold text-white mb-2">Friends</h3>
                                        <p className="text-gray-400 text-sm mb-4">Manage your connections</p>
                                        <div className="space-y-2">
                                            {friendsMenuItems.map((item, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => {
                                                        item.onClick();
                                                        setNav(true);
                                                    }}
                                                    className="w-full flex items-center gap-3 p-4 text-gray-300 hover:text-white
                                                             hover:bg-[#272727] rounded-xl transition-all duration-200 group"
                                                >
                                                    <span className="text-2xl transform transition-transform duration-200 
                                                             group-hover:scale-110">{item.icon}</span>
                                                    <div className="text-left">
                                                        <div className="font-medium">{item.title}</div>
                                                        <div className="text-sm text-gray-400">{item.description}</div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* User Section - Now Second */}
                                    <div className="p-6 border-t border-[#272727]">
                                        <div className="flex items-center gap-4 mb-6">
                                            <img
                                                src={profilePic}
                                                alt="Profile"
                                                className="w-14 h-14 rounded-full object-cover border-2 border-[#272727]"
                                            />
                                            <div>
                                                <p className="text-white font-medium text-lg">{getUserDisplayName()}</p>
                                                <p className="text-gray-400 text-sm">{currentUser?.email}</p>
                                            </div>
                                        </div>

                                        {/* User Menu Items */}
                                        <div className="space-y-2">
                                            {userMenuItems.map((item, index) => (
                                                <button
                                                    key={index}
                                                    onClick={item.onClick}
                                                    disabled={item.disabled}
                                                    className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all duration-200 group
                                                             ${item.disabled 
                                                                ? 'text-gray-500 cursor-not-allowed' 
                                                                : 'text-gray-300 hover:text-white hover:bg-[#272727]'}
                                                             ${item.className || ''}`}
                                                >
                                                    <span className={`text-2xl transform transition-transform duration-200 
                                                                    ${!item.disabled && 'group-hover:scale-110'}`}>
                                                        {item.icon}
                                                    </span>
                                                    <div className="text-left">
                                                        <div className="font-medium">{item.text}</div>
                                                        <div className="text-sm text-gray-400">{item.description}</div>
                                                    </div>
                                                </button>
                                            ))}
                                            <MobileSignOutButton />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Add a spacer div to prevent content from going under the navbar */}
            <div className="h-24 w-full"></div>

            {/* Modals */}
            <ProfileDialog
                isOpen={showProfileDialog}
                onClose={() => setShowProfileDialog(false)}
                currentUser={currentUser}
            />
            <FindFriends
                isOpen={showFindFriends}
                onClose={() => setShowFindFriends(false)}
            />
            <PendingRequests
                isOpen={showPendingRequests}
                onClose={() => setShowPendingRequests(false)}
            />
            {showAllFriends && (
                <AllFriends 
                    isOpen={showAllFriends} 
                    onClose={() => setShowAllFriends(false)}
                    onRefreshChat={onRefreshChat} // Ensure this prop is being passed
                />
            )}
            <OutgoingRequests
                isOpen={showOutgoingRequests}
                onClose={() => setShowOutgoingRequests(false)}
            />
        </>
    );
};

export default Navbar;