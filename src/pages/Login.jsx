import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { VITE_BACKEND_URL, VITE_GOOGLE_CLIENT_ID } from '../googleConfig.js';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Video, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const user = localStorage.getItem('user');
    
    console.log('Login useEffect - user:', user);
    
         // Only redirect if user exists and we're not on the login page
     if (user && window.location.pathname === '/login') {
       console.log('User already logged in, redirecting to dashboard');
       navigate('/dashboard');
       return;
     }

    // Initialize Google Sign-In when component mounts
    const initializeGoogleSignIn = () => {
      if (window.google && VITE_GOOGLE_CLIENT_ID) {
        window.google.accounts.id.initialize({
          client_id: VITE_GOOGLE_CLIENT_ID,
          callback: handleGoogleSignIn,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        // Render Google Sign-In button
        window.google.accounts.id.renderButton(
          document.getElementById('google-signin-button'),
          {
            theme: 'outline',
            size: 'large',
            type: 'standard',
            text: 'signin_with',
            shape: 'rectangular',
            logo_alignment: 'left',
          }
        );
      }
    };

    // Wait for Google script to load
    if (window.google) {
      initializeGoogleSignIn();
    } else {
      // Check every 100ms for Google script to load
      const interval = setInterval(() => {
        if (window.google) {
          clearInterval(interval);
          initializeGoogleSignIn();
        }
      }, 100);

      // Cleanup after 10 seconds
      setTimeout(() => clearInterval(interval), 10000);
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Simulate login process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create user data
      const user = {
        userId: 'user-' + Date.now(),
        email: email,
        name: email.split('@')[0], // Use email prefix as name
        picture: 'https://via.placeholder.com/150'
      };
      
      // Store in localStorage
      localStorage.setItem('user', JSON.stringify(user));
      
             console.log('Login successful, redirecting to dashboard');
       
       // Redirect to dashboard page
       navigate('/dashboard');
    } catch (error) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Check if account exists (best-effort)
      try {
        const check = await axios.get(`${VITE_BACKEND_URL}/auth/check-email`, { params: { email: email.trim().toLowerCase() } });
        if (check.data?.exists) {
          setError('An account with this email already exists. Please sign in.');
          setIsLogin(true);
          return;
        }
      } catch (_) {
        // If check fails, continue to registration and rely on 409 handling
      }

      // Register account on backend
      const res = await axios.post(`${VITE_BACKEND_URL}/auth/register`, {
        email: email.trim().toLowerCase(),
        name: name || email.split('@')[0],
        password
      });

      if (!res.data?.success) {
        const serverMsg = (res.data?.error || '').toString();
        if (serverMsg.toLowerCase().includes('already exists')) {
          setError('An account with this email already exists. Please sign in.');
          setIsLogin(true);
        } else {
          setError(serverMsg || 'Failed to create account.');
        }
        return;
      }

      // Auto-login locally after successful registration
      const user = {
        userId: 'user-' + Date.now(),
        email: email.trim().toLowerCase(),
        name: name || email.split('@')[0],
        picture: 'https://via.placeholder.com/150'
      };
      localStorage.setItem('user', JSON.stringify(user));
      navigate('/dashboard');
    } catch (error) {
      const status = error?.response?.status;
      const msg = error?.response?.data?.error;
      if (status === 409) {
        setError('An account with this email already exists. Please sign in.');
        setIsLogin(true);
      } else if (msg) {
        setError(msg);
      } else {
        // Fallback: re-check email to provide a clearer message
        try {
          const recheck = await axios.post(`${VITE_BACKEND_URL}/auth/check-email`, { email: email.trim().toLowerCase() });
          if (recheck.data?.exists) {
            setError('An account with this email already exists. Please sign in.');
            setIsLogin(true);
          } else {
            setError('Signup failed. Please try again.');
          }
        } catch (_) {
          setError('Signup failed. Please try again.');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async (response) => {
    try {
      console.log('Google Sign-In successful', response);
      
      // Decode the JWT token to get user info
      const payload = JSON.parse(atob(response.credential.split('.')[1]));
      console.log('Google user payload:', payload);
      
      // Create user data from Google response
      const user = {
        userId: payload.sub || 'google-user-' + Date.now(),
        email: payload.email || 'user@gmail.com',
        name: payload.name || payload.given_name || 'Google User',
        picture: payload.picture || 'https://via.placeholder.com/150'
      };
      
      console.log('Created user data:', user);
      
      // Store user data in localStorage
      localStorage.setItem('user', JSON.stringify(user));
      
             console.log('Google authentication successful, redirecting to dashboard');
       
       // Redirect to dashboard page
       navigate('/dashboard');
    } catch (error) {
      console.error('Error during Google authentication:', error);
      setError('Google authentication error. Please try again.');
    }
  };

  const handleForgotPassword = () => {
    alert('Password reset functionality will be implemented later. For now, use any email and password to login.');
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{
      background: 'linear-gradient(135deg, #2B0A3D 0%, #5B2DEE 100%)'
    }}>
             <motion.div 
         initial={{ opacity: 0, scale: 0.9 }}
         animate={{ opacity: 1, scale: 1 }}
         transition={{ duration: 0.6, ease: "easeOut" }}
         className="max-w-sm w-full space-y-6 px-4 sm:px-6 lg:px-8"
       >
        <div className="text-center">
                     <motion.div 
             initial={{ y: -20, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             transition={{ delay: 0.2, duration: 0.6 }}
             className="mx-auto h-12 w-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-xl border border-white/20"
           >
             <Video className="h-6 w-6 text-white" />
           </motion.div>
           <motion.h1 
             initial={{ y: -20, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             transition={{ delay: 0.3, duration: 0.6 }}
             className="mt-4 text-3xl font-extrabold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent"
           >
            Footage Flow
          </motion.h1>
          {/* Removed subtitle */}
        </div>
        
                 <motion.div 
           initial={{ y: 20, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           transition={{ delay: 0.5, duration: 0.6 }}
           className="bg-white/10 backdrop-blur-md rounded-xl shadow-xl border border-white/20 p-6"
         >
                     <form className="space-y-4" onSubmit={isLogin ? handleLogin : handleSignUp}>
            {!isLogin && (
              <div>
                                 <label htmlFor="name" className="block text-xs font-medium text-white/90 mb-1">
                   Full Name
                 </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
                                     <input
                     id="name"
                     name="name"
                     type="text"
                     required={!isLogin}
                     value={name}
                     onChange={(e) => setName(e.target.value)}
                     className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 text-sm"
                     placeholder="Enter your full name"
                   />
                </div>
              </div>
            )}
            
                         <div>
               {/* Removed email label */}
              <div className="relative">
                                 <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" />
                                 <input
                   id="email"
                   name="email"
                   type="email"
                   autoComplete="email"
                   required
                   value={email}
                   onChange={(e) => setEmail(e.target.value)}
                   className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 text-sm"
                   placeholder="Enter your email"
                 />
              </div>
            </div>

                                                   <div>
                {/* Removed password label */}
               <div className="relative">
                 <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
                                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 text-base"
                    placeholder="Enter your password"
                  />
                 <button
                   type="button"
                   onClick={() => setShowPassword(!showPassword)}
                   className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                 >
                   {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                 </button>
               </div>
               {isLogin && (
                 <div className="text-right mt-2">
                   <motion.button
                     whileHover={{ scale: 1.05 }}
                     type="button"
                     onClick={handleForgotPassword}
                     className="text-sm font-medium text-white/80 hover:text-white transition-colors"
                   >
                     Forgot password?
                   </motion.button>
                 </div>
               )}
             </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-500/20 border border-red-400/30 rounded-xl backdrop-blur-sm"
              >
                <p className="text-red-200 text-sm">{error}</p>
              </motion.div>
            )}

            <div className="space-y-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl uppercase tracking-wide"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {isLogin ? 'Signing in...' : 'Creating account...'}
                  </div>
                ) : (
                  isLogin ? 'Sign In' : 'Create Account'
                )}
              </motion.button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/20" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-transparent text-white/60">Or continue with</span>
                </div>
              </div>

              {/* Native Google button (renders with official logo) */}
              <div id="google-signin-button" className="w-full flex justify-center"></div>
            </div>

                                                   <div className="space-y-3">
                <div className="text-sm text-center">
                  {isLogin ? (
                                         <motion.button
                       whileHover={{ scale: 1.05 }}
                       type="button"
                       onClick={() => setIsLogin(false)}
                       className="font-medium text-white/80 hover:text-white transition-colors"
                     >
                       Don't have an account? <span className="text-purple-300 font-semibold">Sign up</span>
                     </motion.button>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      type="button"
                      onClick={() => setIsLogin(true)}
                      className="font-medium text-white/80 hover:text-white transition-colors"
                    >
                      Already have an account? Sign in
                    </motion.button>
                  )}
                </div>
              </div>
          </form>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;
