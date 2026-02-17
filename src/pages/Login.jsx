
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Login() {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [message, setMessage] = useState('');
    const navigate = useNavigate();
    const { login, signup, loginWithGoogle } = useAuth();

    const handleGoogleLogin = async () => {
        try {
            await loginWithGoogle();
        } catch (error) {
            setMessage(error.message);
        }
    };

    const [connectionStatus, setConnectionStatus] = useState(null); // 'success', 'error', null

    useEffect(() => {
        const checkConnection = async () => {
            try {
                // Try a simple ping to check connection validity
                const { error } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).limit(1);
                if (error && error.code !== 'PGRST116' && error.code !== '42P01') {
                    console.error('Connection Check Failed:', error);
                    if (error.message.includes('FetchError') || error.message.includes('Network request failed')) {
                        setConnectionStatus('Network Error: Cannot reach Supabase.');
                    } else if (error.code === '401' || error.code === '403') {
                        setConnectionStatus('Auth Config Error: API Key rejected.');
                    } else {
                        setConnectionStatus('Database Connection Issue');
                    }
                } else {
                    setConnectionStatus('success');
                }
            } catch (err) {
                console.error('Connection Check Exception:', err);
                setConnectionStatus('Connection Failed');
            }
        };
        checkConnection();
    }, []);

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            if (isSignUp) {
                await signup(email, password);
                setMessage('Check your email for the confirmation link!');
            } else {
                await login(email, password);
                navigate('/'); // Redirect to home on success
            }
        } catch (error) {
            console.error('Auth Error:', error);
            setMessage(error.message || 'Authentication failed. Please check your credentials and connection.');
            // Check for potential API key issues
            if (error.message && (error.message.includes('apikey') || error.message.includes('header'))) {
                setMessage('Configuration Error: Invalid API Key. Please check your .env file.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white px-4">
            <div className="w-full max-w-md p-8 bg-zinc-900 rounded-lg shadow-xl border border-zinc-800">
                <h1 className="text-3xl font-bold mb-6 text-center text-red-600">
                    {isSignUp ? 'Join The Temple' : 'Enter The Temple'}
                </h1>

                {connectionStatus && connectionStatus !== 'success' && (
                    <div className="p-3 mb-4 rounded bg-yellow-900/50 text-yellow-200 text-sm border border-yellow-700">
                        ⚠️ Limit Connectivity: {connectionStatus}. Check your internet or API keys.
                    </div>
                )}

                {message && (
                    <div className={`p-3 mb-4 rounded ${message.includes('Check') ? 'bg-green-900/50 text-green-200' : 'bg-red-900/50 text-red-200'}`}>
                        {message}
                    </div>
                )}

                <Button
                    onClick={handleGoogleLogin}
                    className="w-full bg-white text-black hover:bg-gray-200 font-bold py-2 mb-4 flex items-center justify-center gap-2"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                            fill="#EA4335"
                            d="M24 12.276c0-.887-.076-1.743-.217-2.568H12.24v4.851h6.635c-.287 1.547-1.157 2.859-2.464 3.73l-.004.032 3.81 2.946.264.027c2.232-2.054 3.518-5.078 3.518-8.718z"
                        />
                        <path
                            fill="#34A853"
                            d="M12.24 24c3.24 0 5.957-1.074 7.943-2.906l-3.818-2.964c-1.074.719-2.451 1.144-4.125 1.144-3.136 0-5.792-2.118-6.738-4.965l-.031.003-3.959 3.065-.013.036C3.515 21.258 7.564 24 12.24 24z"
                        />
                        <path
                            fill="#4A90E2"
                            d="M5.502 14.309c-.238-.713-.375-1.474-.375-2.309s.137-1.596.375-2.309l-.004-.034-4.008-3.11-.035.016C.508 8.046 0 9.969 0 12c0 2.03.508 3.953 1.455 5.488l4.047-3.179z"
                        />
                        <path
                            fill="#FBBC05"
                            d="M12.24 4.75c1.763 0 3.35.607 4.595 1.795l3.447-3.447C18.197 1.146 15.48 0 12.24 0 7.564 0 3.515 2.742 1.455 6.512l4.045 3.179c.946-2.847 3.602-4.941 6.74-4.941z"
                        />
                    </svg>
                    Sign in with Google
                </Button>

                <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-zinc-700" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-zinc-900 px-2 text-zinc-400">Or continue with</span>
                    </div>
                </div>

                <form onSubmit={handleAuth} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="bg-black border-zinc-700"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="bg-black border-zinc-700"
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2"
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
                    </Button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-400">
                    {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                    <button
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="ml-2 text-red-500 hover:text-red-400 font-semibold underline decoration-transparent hover:decoration-red-500 transition-all"
                    >
                        {isSignUp ? 'Sign In' : 'Sign Up'}
                    </button>
                </div>
            </div>
        </div>
    );
}
