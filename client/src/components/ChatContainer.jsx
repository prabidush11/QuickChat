import React, { useContext, useEffect, useRef, useState } from 'react';
import assets from '../assets/assets'; // Assuming messagesDummyData is no longer needed or is imported elsewhere
import { formatTime } from '../lib/utils';
import { ChatContext } from '../../context/ChatContext';
import { AuthContext } from '../../context/AuthContext';
import toast from 'react-hot-toast'; // Corrected: toast import added

const ChatContainer = () => {

    // Corrected: Get onlineUsers from ChatContext
    const { messages, selectedUser, setSelectedUser, sendMessage, getMessages, onlineUsers } = useContext(ChatContext);
    const { authUser } = useContext(AuthContext); // authUser correctly from AuthContext

    const scrollEnd = useRef();

    const [input, setInput] = useState('');

    // Handle sending a text message
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (input.trim() === "") return null; // Prevent sending empty messages
        await sendMessage({ text: input.trim() });
        setInput(""); // Clear input after sending
    }

    // Handle sending an image
    const handleSendImage = async (e) => {
        const file = e.target.files[0];
        if (!file || !file.type.startsWith("image/")) {
            toast.error("Please select an image file."); // toast will now work
            return;
        }
        const reader = new FileReader();
        reader.onloadend = async () => {
            await sendMessage({ image: reader.result }); // Send image as base64 string
            e.target.value = ""; // Clear the file input
        };
        reader.readAsDataURL(file); // Read file as data URL
    };

    // Effect to fetch messages when a user is selected
    useEffect(() => {
        if (selectedUser) {
            getMessages(selectedUser._id);
        }
    }, [selectedUser, getMessages]); // Added getMessages to dependency array for useEffect safety

    // Effect to scroll to the end of messages on new messages
    useEffect(() => {
        if (scrollEnd.current && messages) {
            scrollEnd.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    // Conditional rendering based on whether a user is selected
    return selectedUser ? (
        <div className='h-full overflow-scroll relative backdrop-blur-lg'>
            {/**----------Header---------- */}
            <div className='flex items-center gap-3 py-3 mx-4 border-b border-stone-500'>
                <img src={selectedUser.profilePic || assets.avatar_icon} alt="" className='w-8 rounded-full' />
                <p className='flex-1 text-lg text-white flex items-center gap-2'>
                    {selectedUser.fullName}
                    {/* Display online status dot if user is online */}
                    {onlineUsers.includes(selectedUser._id) && <span className='w-2 h-2 rounded-full bg-green-500 inline-block ml-1'></span>}
                </p>
                {/* Back button for mobile, help icon for desktop */}
                <img onClick={() => setSelectedUser(null)} src={assets.arrow_icon} alt="" className='md:hidden max-w-7 cursor-pointer' />
                <img src={assets.help_icon} alt="" className='max-md:hidden max-w-5' />
            </div>

            {/*------------Chat Area------------*/}
            <div className='flex flex-col h-[calc(100%-120px)] overflow-y-scroll p-3 pb-6'>
                {/* Map through messages to display them */}
                {messages.map((msg, index) => {
                    const isMyMessage = msg.senderId === authUser._id; // Check if the message is from the current authenticated user

                    return (
                        <div
                            key={index}
                            // Apply Tailwind classes for layout based on sender
                            // justify-end for sender (right side), justify-start for receiver (left side)
                            className={`flex items-end gap-2 ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                        >
                            {/* Render avatar for RECEIVED messages (first in flex order) */}
                            {!isMyMessage && (
                                <div className='text-center text-xs'>
                                    <img
                                        src={selectedUser?.profilePic || assets.avatar_icon}
                                        alt=""
                                        className='w-7 rounded-full'
                                    />
                                    <p className='text-gray-500'>{formatTime(msg.createdAt)}</p>
                                </div>
                            )}

                            {/* Message Content (Image or Text) */}
                            {msg.image ? (
                                <img
                                    src={msg.image}
                                    alt=""
                                    className={`max-w-[230px] border border-gray-700 rounded-lg overflow-hidden mb-8 ${isMyMessage ? 'rounded-br-none' : 'rounded-bl-none'}`}
                                />
                            ) : (
                                <p
                                    className={`p-2 max-w-[200px] md:text-sm font-light rounded-lg mb-8 break-all bg-violet-500/30 text-white ${isMyMessage ? 'rounded-br-none' : 'rounded-bl-none'}`}
                                >
                                    {msg.text}
                                </p>
                            )}

                            {/* Render avatar for SENT messages (last in flex order) */}
                            {isMyMessage && (
                                <div className='text-center text-xs'>
                                    <img
                                        src={authUser?.profilePic || assets.avatar_icon}
                                        alt=""
                                        className='w-7 rounded-full'
                                    />
                                    <p className='text-gray-500'>{formatTime(msg.createdAt)}</p>
                                </div>
                            )}
                        </div>
                    );
                })}
                {/* Scroll anchor div */}
                <div ref={scrollEnd}></div>
            </div>

            {/*--------Bottom Input Area-------*/}
            <div className='absolute bottom-0 left-0 right-0 flex items-center gap-3 p-3'>
                <div className='flex-1 flex items-center bg-gray-100/12 px-3 rounded-full'>
                    {/* Text input field */}
                    <input
                        onChange={(e) => setInput(e.target.value)}
                        value={input}
                        onKeyDown={(e) => e.key === "Enter" ? handleSendMessage(e) : null}
                        type="text"
                        placeholder="Type a message"
                        className='flex-1 text-sm p-3 border-none rounded-lg outline-none text-white placeholder-gray-400'
                    />
                    {/* Hidden file input for image upload */}
                    <input onChange={handleSendImage} type="file" id='image' accept='image/png,image/jpeg,image/jpg' hidden />
                    {/* Label (icon) to trigger file input */}
                    <label htmlFor="image">
                        <img src={assets.gallery_icon} alt="Attach Image" className='w-5 mr-2 cursor-pointer' />
                    </label>
                </div>
                {/* Send message button */}
                <img onClick={handleSendMessage} src={assets.send_button} alt="Send" className='w-9 cursor-pointer' />
            </div>

        </div>
    ) : (
        // Default view when no user is selected
        <div className='flex flex-col items-center justify-center gap-2 text-gray-500 bg-white/10 max-md:hidden'>
            <img src={assets.logo_icon} className='max-w-16' alt="" />
            <p className='text-lg font-medium text-white'>Chat anytime, anywhere</p>
        </div>
    );
};

export default ChatContainer;