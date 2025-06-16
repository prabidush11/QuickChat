// Filename: components/SideBar.js
import React, { useContext, useEffect, useState, useCallback } from 'react';
import assets from '../assets/assets'; // Assuming your assets are here
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext'; // Assuming AuthContext
import { ChatContext } from '../../context/ChatContext'; // Assuming ChatContext

const SideBar = () => {
  const { 
    getUsers, 
    users, 
    selectedUser, 
    setSelectedUser, 
    unseenMessages, 
    setUnseenMessages,
    onlineUsers // Using onlineUsers from ChatContext
  } = useContext(ChatContext);

  const { logout, authUser } = useContext(AuthContext); // Assuming authUser is available from AuthContext
  const navigate = useNavigate();

  const [searchInput, setSearchInput] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Memoized filtered users calculation
  const filteredUsers = React.useMemo(() => {
    return searchInput 
      ? users.filter(user => 
          user.fullName.toLowerCase().includes(searchInput.toLowerCase())
        ) 
      : users;
  }, [users, searchInput]);

  // Improved user fetching with loading state
  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      await getUsers(); // Calls the getUsers function from ChatContext
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setIsLoading(false);
    }
  }, [getUsers]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]); // Removed onlineUsers from dependency as fetchUsers only calls getUsers once

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    // Clear unseen count when selecting user
    setUnseenMessages(prev => ({
      ...prev,
      [user._id]: 0
    }));
  };

  return (
    <div className={`bg-[#818582]/10 h-full p-5 rounded-r-xl overflow-y-auto text-white ${
      selectedUser ? "max-md:hidden" : ""
    }`}>
      <div className='pb-5'>
        <div className='flex justify-between items-center'>
          <img 
            src={assets.logo} 
            alt="logo" 
            className='max-w-40 cursor-pointer'
            onClick={() => navigate('/')}
          />
          
          {/* Improved Dropdown Menu */}
          <div className="relative">
            <img
              src={assets.menu_icon}
              alt="Menu"
              className='h-5 w-5 cursor-pointer'
              onClick={() => setMenuOpen(!menuOpen)}
            />
            {menuOpen && (
              <div className='absolute right-0 mt-2 w-40 bg-[#282142] rounded-md shadow-lg z-50 border border-gray-600'>
                <div className='py-1'>
                  <button
                    onClick={() => {
                      navigate('/profile');
                      setMenuOpen(false);
                    }}
                    className='block w-full text-left px-4 py-2 text-sm text-gray-100 hover:bg-[#3e365a]'
                  >
                    Edit Profile
                  </button>
                  <div className='border-t border-gray-600'></div>
                  <button
                    onClick={() => {
                      logout();
                      setMenuOpen(false);
                    }}
                    className='block w-full text-left px-4 py-2 text-sm text-gray-100 hover:bg-[#3e365a]'
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className='bg-[#282142] rounded-full flex items-center gap-2 py-3 px-4 mt-5'>
          <img src={assets.search_icon} alt="search" className='w-3' />
          <input 
            onChange={(e) => setSearchInput(e.target.value)}
            value={searchInput}
            type="text" 
            className='bg-transparent border-none outline-none text-white text-xs placeholder-[#c8c8c8] flex-1' 
            placeholder='Search User...' 
          />
        </div>
      </div>

      {/* Users List */}
      {isLoading ? (
        <div className="flex justify-center items-center h-20">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-violet-500"></div>
        </div>
      ) : (
        <div className='space-y-2'>
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <div 
                onClick={() => handleUserSelect(user)} 
                key={user._id} 
                className={`relative flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedUser?._id === user._id 
                    ? 'bg-[#282142]/70' 
                    : 'hover:bg-[#282142]/30'
                }`}
              >
                <div className="relative">
                  <img 
                    src={user?.profilePic || assets.avatar_icon} 
                    alt={user.fullName} 
                    className='w-10 h-10 rounded-full object-cover'
                  />
                  {onlineUsers.includes(user._id) && ( // Use onlineUsers from ChatContext
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#282142]"></div>
                  )}
                </div>
                
                <div className='flex-1 min-w-0'>
                  <p className='font-medium truncate'>{user.fullName}</p>
                  <p className={`text-xs ${
                    onlineUsers.includes(user._id) 
                      ? 'text-green-400' 
                      : 'text-gray-400'
                  }`}>
                    {onlineUsers.includes(user._id) ? 'Online' : 'Offline'}
                  </p>
                </div>
                
                {unseenMessages[user._id] > 0 && (
                  <div className='absolute right-4 flex items-center justify-center h-5 w-5 rounded-full bg-violet-500 text-xs'>
                    {Math.min(unseenMessages[user._id], 99)}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-gray-400">
              {searchInput ? 'No matching users found' : 'No users available'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SideBar;