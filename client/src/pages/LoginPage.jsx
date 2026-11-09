import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import assets from '../assets/assets';
import { AuthContext } from '../../context/AuthContext';

const LoginPage = () => {
    const [currState, setCurrentState] = useState("Login");
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [bio, setBio] = useState("");
    const [isDataSubmitted, setIsDataSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const onSubmitHandler = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (currState === 'Sign up' && !isDataSubmitted) {
                setIsDataSubmitted(true);
                return;
            }

            const credentials = currState === "Sign up" 
                ? { fullName, email, password, bio }
                : { email, password };

            const success = await login(
                currState === "Sign up" ? 'signup' : 'login', 
                credentials
            );

            if (success) {
                navigate('/');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className='min-h-screen bg-cover bg-center flex items-center justify-center gap-8 sm:justify-evenly max-sm:flex-col backdrop-blur-2xl'>
            <img src={assets.logo_big} alt="" className='w-[min(30vw,250px)]' />

            <form onSubmit={onSubmitHandler} className='border-2 bg-white/8 text-white border-gray-500 p-6 flex flex-col gap-6 rounded-lg shadow-lg'>
                <h2 className='font-medium text-2xl flex justify-between items-center'>
                    {currState}
                    {isDataSubmitted && (
                        <img 
                            onClick={() => setIsDataSubmitted(false)} 
                            src={assets.arrow_icon} 
                            alt="" 
                            className='w-5 cursor-pointer' 
                        />
                    )}
                </h2>

                {currState === "Sign up" && !isDataSubmitted && (
                    <input
                        onChange={(e) => setFullName(e.target.value)}
                        value={fullName}
                        type="text"
                        className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
                        placeholder='Full Name'
                        required
                    />
                )}

                {!isDataSubmitted && (
                    <>
                        <input
                            onChange={(e) => setEmail(e.target.value)}
                            value={email}
                            type="email"
                            placeholder='Email Address'
                            required
                            className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
                        />
                        <input
                            onChange={(e) => setPassword(e.target.value)}
                            value={password}
                            type="password"
                            placeholder='Password'
                            required
                            className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
                        />
                    </>
                )}

                {currState === "Sign up" && isDataSubmitted && (
                    <textarea
                        onChange={(e) => setBio(e.target.value)}
                        value={bio}
                        rows={4}
                        className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
                        placeholder='Provide a short bio...'
                        required
                    />
                )}

                <button 
                    type='submit' 
                    className='py-3 bg-gradient-to-r from-purple-400 to-violet-600 text-white rounded-md cursor-pointer disabled:opacity-50'
                    disabled={isLoading}
                >
                    {isLoading ? "Processing..." : (currState === "Sign up" ? "Create Account" : "Login")}
                </button>

                <div className='flex items-center gap-2 text-sm text-gray-500'>
                    <input 
                        type="checkbox" 
                        required 
                        className='h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500' 
                    />
                    <p>Agree to the terms of use & privacy policy</p>
                </div>

                <div className='flex flex-col gap-2'>
                    {currState === "Sign up" ? (
                        <p className='text-sm text-gray-600'>
                            Already have an account?{' '}
                            <span 
                                onClick={() => {
                                    setCurrentState("Login"); 
                                    setIsDataSubmitted(false);
                                }} 
                                className='font-medium text-violet-500 cursor-pointer'
                            >
                                Login here
                            </span>
                        </p>
                    ) : ( 
                        <p className='text-sm text-gray-600'>
                            Create an account{' '}
                            <span 
                                onClick={() => setCurrentState("Sign up")} 
                                className='font-medium text-violet-500 cursor-pointer'
                            >
                                Click here
                            </span>
                        </p>
                    )}
                </div>
            </form>
        </div>
    );
};

export default LoginPage;