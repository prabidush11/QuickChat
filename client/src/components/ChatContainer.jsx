import React, { useContext, useEffect, useRef, useState } from 'react';
import assets from '../assets/assets'; // Assuming messagesDummyData is no longer needed or is imported elsewhere
import { formatTime } from '../lib/utils';
import { ChatContext } from '../../context/ChatContext';
import { AuthContext } from '../../context/AuthContext';
import toast from 'react-hot-toast'; // Corrected: toast import added

// Label for the date separator: "Today", "Yesterday", or e.g. "12 March 2026"
const formatDateLabel = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
};

// "Friends for X days/months/years", counted from the first message between the two users
const formatFriendDuration = (firstMessageDate) => {
    if (!firstMessageDate) return "Send a message to become friends";

    const start = new Date(firstMessageDate);
    const now = new Date();
    const days = Math.floor((now - start) / (1000 * 60 * 60 * 24));

    let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    if (now.getDate() < start.getDate()) months--; // Not a full month yet
    const years = Math.floor(months / 12);

    const plural = (n, unit) => `${n} ${unit}${n === 1 ? '' : 's'}`;

    if (years >= 1) return `Friends for ${plural(years, 'year')}`;
    if (months >= 1) return `Friends for ${plural(months, 'month')}`;
    if (days < 1) return "Friends since today";
    return `Friends for ${plural(days, 'day')}`;
};

const ChatContainer = () => {

    // Corrected: Get onlineUsers from ChatContext
    const { messages, selectedUser, setSelectedUser, sendMessage, deleteMessage, editMessage, getMessages, onlineUsers } = useContext(ChatContext);
    const { authUser } = useContext(AuthContext); // authUser correctly from AuthContext

    const scrollEnd = useRef();

    const [input, setInput] = useState('');
    const [activeMessageId, setActiveMessageId] = useState(null); // Own message showing the delete option

    // Toggle the delete option on a message the current user sent
    const handleMessageClick = (e, msg) => {
        if (msg.senderId !== authUser._id) return;
        e.stopPropagation(); // Keep the outside-click listener from closing it right away
        setActiveMessageId(prev => (prev === msg._id ? null : msg._id));
    };

    const handleDeleteMessage = async (messageId) => {
        await deleteMessage(messageId);
        setActiveMessageId(null);
        if (editingMessage?._id === messageId) cancelEdit();
    };

    // Message currently being edited (its text is loaded into the input box)
    const [editingMessage, setEditingMessage] = useState(null);

    const startEdit = (msg) => {
        setEditingMessage(msg);
        setInput(msg.text);
        setActiveMessageId(null);
        inputRef.current?.focus();
    };

    const cancelEdit = () => {
        setEditingMessage(null);
        setInput("");
    };

    const inputRef = useRef();

    // Handle sending a text message (or saving an edit)
    const handleSendMessage = async (e) => {
        e.preventDefault();
        const text = input.trim();
        if (text === "") return null; // Prevent sending empty messages

        if (editingMessage) {
            if (text !== editingMessage.text) {
                const ok = await editMessage(editingMessage._id, text);
                if (!ok) return;
            }
            cancelEdit();
            return;
        }

        await sendMessage({ text });
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

    // Hide the delete option when clicking/touching anywhere else
    useEffect(() => {
        if (!activeMessageId) return;
        const close = () => setActiveMessageId(null);
        document.addEventListener('click', close);
        return () => document.removeEventListener('click', close);
    }, [activeMessageId]);

    // Hide the delete option and cancel any edit when switching chats
    useEffect(() => {
        setActiveMessageId(null);
        setEditingMessage(null);
        setInput("");
    }, [selectedUser]);

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
                <img src={selectedUser.profilePic || assets.avatar_icon} alt="" className='w-8 h-8 rounded-full object-cover shrink-0' />
                <p className='flex-1 text-lg text-white flex items-center gap-2'>
                    {selectedUser.fullName}
                    {/* Display online status dot if user is online */}
                    {onlineUsers.includes(selectedUser._id) && <span className='w-2 h-2 rounded-full bg-green-500 inline-block ml-1'></span>}
                </p>
                {/* Back button for mobile, help icon for desktop */}
                <img onClick={() => setSelectedUser(null)} src={assets.arrow_icon} alt="" className='md:hidden max-w-7 cursor-pointer' />
                {/* Info icon: hover to see how long you've been chatting */}
                <div className='relative group max-md:hidden'>
                    <img src={assets.help_icon} alt="Info" className='max-w-5 cursor-pointer' />
                    <span className='absolute right-0 top-full mt-2 whitespace-nowrap px-2 py-1 text-xs text-white bg-gray-800/90 rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-10'>
                        {formatFriendDuration(messages[0]?.createdAt)}
                    </span>
                </div>
            </div>

            {/*------------Chat Area------------*/}
            <div className='flex flex-col h-[calc(100%-120px)] overflow-y-scroll p-3 pb-6'>
                {/* Map through messages to display them */}
                {messages.map((msg, index) => {
                    const isMyMessage = msg.senderId === authUser._id; // Check if the message is from the current authenticated user

                    // Show a date tab when this message starts a new day
                    const showDate = index === 0 ||
                        new Date(msg.createdAt).toDateString() !== new Date(messages[index - 1].createdAt).toDateString();

                    return (
                        <React.Fragment key={msg._id || index}>
                        {showDate && (
                            <div className='flex justify-center my-3'>
                                <span className='px-3 py-1 text-xs text-gray-300 bg-gray-800/60 rounded-md'>
                                    {formatDateLabel(msg.createdAt)}
                                </span>
                            </div>
                        )}
                        <div
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
                                        className='w-7 h-7 rounded-full object-cover'
                                    />
                                    <p className='text-gray-500'>{formatTime(msg.createdAt)}</p>
                                </div>
                            )}

                            {/* Edit/Delete options for own messages (shown after clicking the message) */}
                            {isMyMessage && activeMessageId === msg._id && (
                                <div className='mb-8 flex gap-1'>
                                    {!msg.image && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); startEdit(msg); }}
                                            className='px-2 py-1 text-xs text-white bg-violet-500/80 hover:bg-violet-600 rounded-md cursor-pointer'
                                        >
                                            Edit
                                        </button>
                                    )}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDeleteMessage(msg._id); }}
                                        className='px-2 py-1 text-xs text-white bg-red-500/80 hover:bg-red-600 rounded-md cursor-pointer'
                                    >
                                        Delete
                                    </button>
                                </div>
                            )}

                            {/* Message Content (Image or Text) */}
                            {msg.image ? (
                                <img
                                    onClick={(e) => handleMessageClick(e, msg)}
                                    src={msg.image}
                                    alt=""
                                    className={`max-w-[230px] border border-gray-700 rounded-lg overflow-hidden mb-8 ${isMyMessage ? 'rounded-br-none' : 'rounded-bl-none'}`}
                                />
                            ) : (
                                <p
                                    onClick={(e) => handleMessageClick(e, msg)}
                                    className={`${isMyMessage ? 'cursor-pointer' : ''} p-2 max-w-[200px] md:text-sm font-light rounded-lg mb-8 wrap-break-word whitespace-pre-wrap bg-violet-500/30 text-white ${isMyMessage ? 'rounded-br-none' : 'rounded-bl-none'}`}
                                >
                                    {msg.text}
                                    {msg.edited && <span className='block text-[10px] text-gray-300 text-right mt-1'>(edited)</span>}
                                </p>
                            )}

                            {/* Render avatar for SENT messages (last in flex order) */}
                            {isMyMessage && (
                                <div className='text-center text-xs'>
                                    <img
                                        src={authUser?.profilePic || assets.avatar_icon}
                                        alt=""
                                        className='w-7 h-7 rounded-full object-cover'
                                    />
                                    <p className='text-gray-500'>{formatTime(msg.createdAt)}</p>
                                </div>
                            )}
                        </div>
                        </React.Fragment>
                    );
                })}
                {/* Scroll anchor div */}
                <div ref={scrollEnd}></div>
            </div>

            {/*--------Bottom Input Area-------*/}
            <div className='absolute bottom-0 left-0 right-0 flex items-center gap-3 p-3'>
                {/* Editing banner */}
                {editingMessage && (
                    <div className='absolute bottom-full left-3 right-3 flex items-center justify-between gap-2 px-3 py-1 text-xs text-white bg-violet-500/30 rounded-md'>
                        <span className='truncate'>Editing: {editingMessage.text}</span>
                        <button onClick={cancelEdit} className='cursor-pointer text-gray-300 hover:text-white'>Cancel</button>
                    </div>
                )}
                <div className='flex-1 flex items-center bg-gray-100/12 px-3 rounded-full'>
                    {/* Text input field */}
                    <input
                        ref={inputRef}
                        onChange={(e) => setInput(e.target.value)}
                        value={input}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleSendMessage(e);
                            else if (e.key === "Escape" && editingMessage) cancelEdit();
                        }}
                        type="text"
                        placeholder={editingMessage ? "Edit message" : "Type a message"}
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