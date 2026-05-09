import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
    Building2, Moon, Sun, Menu, X, MapPin, BarChart3,
    LayoutDashboard, FileText, Search, AlertCircle, Shield, User, LogIn, LogOut
} from 'lucide-react';

const navLinks = [
    { to: '/', label: 'Home', icon: Building2 },
    { to: '/report', label: 'Report Issue', icon: AlertCircle },
    { to: '/track', label: 'Track', icon: Search },
    { to: '/map', label: 'Map View', icon: MapPin },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/admin', label: 'Admin', icon: LayoutDashboard, adminOnly: true },
];

export default function Navbar() {
    const { darkMode, toggleDarkMode, role, authUser, isAuthenticated, logoutUser } = useApp();
    const [menuOpen, setMenuOpen] = useState(false);
    const navigate = useNavigate();

    const visibleLinks = navLinks.filter((l) => !l.adminOnly || role === 'admin');

    return (
        <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 shadow-sm">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2.5 group">
                        <div className="w-9 h-9 rounded-xl bg-civic-600 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                            <Building2 size={20} className="text-white" />
                        </div>
                        <div className="hidden sm:block">
                            <div className="font-bold text-civic-700 dark:text-civic-300 text-sm leading-tight">CivicSense</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 leading-tight">Smart City Platform</div>
                        </div>
                    </Link>

                    {/* Desktop links */}
                    <div className="hidden md:flex items-center gap-1">
                        {visibleLinks.map(({ to, label, icon: Icon }) => (
                            <NavLink
                                key={to}
                                to={to}
                                className={({ isActive }) =>
                                    `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                                        ? 'bg-civic-100 text-civic-700 dark:bg-civic-900/40 dark:text-civic-300'
                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                                    }`
                                }
                                end={to === '/'}
                            >
                                <Icon size={15} />
                                <span>{label}</span>
                            </NavLink>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        {/* Auth: User info / Login button */}
                        {isAuthenticated ? (
                            <div className="hidden sm:flex items-center gap-2">
                                {/* User badge */}
                                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${role === 'admin'
                                    ? 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-700'
                                    : 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700'
                                    }`}>
                                    {role === 'admin' ? <Shield size={13} /> : <User size={13} />}
                                    <span>{authUser?.name?.split(' ')[0] || 'User'}</span>
                                </div>
                                {/* Logout button */}
                                <button
                                    onClick={() => { logoutUser(); navigate('/'); }}
                                    title="Sign out"
                                    className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:bg-red-50 hover:text-red-500 dark:text-slate-400 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-all duration-200"
                                >
                                    <LogOut size={17} />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => navigate('/login')}
                                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700 dark:hover:bg-blue-900/60 transition-all duration-200"
                            >
                                <LogIn size={13} />
                                <span>Sign In</span>
                            </button>
                        )}

                        {/* Dark mode toggle */}
                        <button
                            onClick={toggleDarkMode}
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-all duration-200"
                            aria-label="Toggle dark mode"
                        >
                            {darkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
                        </button>

                        {/* CTA button */}
                        <button
                            onClick={() => navigate('/report')}
                            className="hidden sm:flex btn-primary text-xs"
                        >
                            <FileText size={14} />
                            Report
                        </button>

                        {/* Mobile hamburger */}
                        <button
                            className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-all"
                            onClick={() => setMenuOpen(!menuOpen)}
                        >
                            {menuOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>
                </div>

                {/* Mobile menu */}
                {menuOpen && (
                    <div className="md:hidden pb-4 pt-2 border-t border-slate-200 dark:border-slate-700 animate-fade-in">
                        <div className="flex flex-col gap-1">
                            {visibleLinks.map(({ to, label, icon: Icon }) => (
                                <NavLink
                                    key={to}
                                    to={to}
                                    onClick={() => setMenuOpen(false)}
                                    className={({ isActive }) =>
                                        `flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                                            ? 'bg-civic-100 text-civic-700 dark:bg-civic-900/40 dark:text-civic-300'
                                            : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                                        }`
                                    }
                                    end={to === '/'}
                                >
                                    <Icon size={16} /> {label}
                                </NavLink>
                            ))}
                            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                                {isAuthenticated ? (
                                    <>
                                        <div className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border ${role === 'admin'
                                            ? 'bg-purple-100 text-purple-700 border-purple-300'
                                            : 'bg-emerald-100 text-emerald-700 border-emerald-300'
                                            }`}>
                                            {role === 'admin' ? <Shield size={13} /> : <User size={13} />}
                                            {authUser?.name || 'User'} ({role})
                                        </div>
                                        <button
                                            onClick={() => { logoutUser(); setMenuOpen(false); navigate('/'); }}
                                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-red-300 bg-red-50 text-red-600 hover:bg-red-100"
                                        >
                                            <LogOut size={13} /> Logout
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => { setMenuOpen(false); navigate('/login'); }}
                                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border bg-blue-50 text-blue-700 border-blue-300"
                                    >
                                        <LogIn size={13} /> Sign In / Register
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </nav>
        </header>
    );
}
