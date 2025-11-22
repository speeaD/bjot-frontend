'use client';

import { useState } from 'react';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';

export default function Login() {
    const [isLogin, setIsLogin] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Invalid email format';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        if (!isLogin && formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (validateForm()) {
            console.log('Form submitted:', { ...formData, isLogin });
            // Add your authentication logic here
            alert(`${isLogin ? 'Login' : 'Sign up'} successful!`);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        // Clear error when user starts typing
        if (errors[e.target.name]) {
            setErrors({
                ...errors,
                [e.target.name]: ''
            });
        }
    };
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">
                        BJOT Admin
                    </h1>
                    <p className="text-slate-600">
                      Sign in to manage your quizzes
                    </p>
                </div>

                {/* Auth Card */}
                <div className="bg-white rounded-2xl shadow-lg p-8">
                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email Field */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${errors.email
                                            ? 'border-red-300 focus:ring-red-200'
                                            : 'border-slate-300 focus:ring-slate-200'
                                        }`}
                                    placeholder="admin@example.com"
                                />
                            </div>
                            {/* {state?.errors?.email && (
                                <p className="mt-1 text-sm text-red-600">{state.errors.email}</p>
                            )} */}
                        </div>

                        {/* Password Field */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className={`w-full pl-11 pr-11 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${errors.password
                                            ? 'border-red-300 focus:ring-red-200'
                                            : 'border-slate-300 focus:ring-slate-200'
                                        }`}
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                            {/* {state?.errors?.password && (
                                <p className="mt-1 text-sm text-red-600">{state.errors.password}</p>
                            )} */}
                        </div>

                        
                        
                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="w-full bg-slate-900 text-white py-3 rounded-lg font-medium hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                        >
                            Sign In
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}