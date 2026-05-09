import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, User, ChevronRight, Building2, LayoutDashboard, FileEdit } from 'lucide-react';

export default function AuthSelectionPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-[calc(100vh-64px)] flex flex-col md:flex-row items-stretch">
            {/* Left Side: Admin */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-16 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="text-center max-w-sm">
                    <div className="inline-flex px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-wider mb-6">
                        Authority
                    </div>
                    <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 mx-auto mb-8 animate-float">
                        <Shield size={32} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white mb-4">
                        For Administrators
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mb-10 leading-relaxed">
                        Access the control center to manage civic reports, analyze data trends, and coordinate resolution across departments.
                    </p>

                    <button
                        onClick={() => navigate('/login/form?role=admin')}
                        className="group relative w-full inline-flex items-center justify-center px-8 py-4 font-bold text-white bg-slate-900 border border-slate-900 rounded-xl transition-all duration-300 hover:bg-slate-800 hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            Login <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </span>
                    </button>

                    <div className="mt-8 text-sm text-slate-500">
                        Don't have an organization account? <br />
                        <button
                            onClick={() => navigate('/register?role=admin')}
                            className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline mt-1"
                        >
                            Request onboarding
                        </button>
                    </div>
                </div>
            </div>

            {/* Right Side: Citizen */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-16 bg-white dark:bg-slate-900">
                <div className="text-center max-w-sm">
                    <div className="inline-flex px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider mb-6">
                        Community
                    </div>
                    <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 mx-auto mb-8 animate-float-delayed">
                        <User size={32} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white mb-4">
                        For Citizens
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mb-10 leading-relaxed">
                        Join millions of residents reporting local issues, tracking resolution progress, and making their neighborhood safer.
                    </p>

                    <button
                        onClick={() => navigate('/login/form?role=citizen')}
                        className="group relative w-full inline-flex items-center justify-center px-8 py-4 font-bold text-white bg-slate-900 border border-slate-900 rounded-xl transition-all duration-300 hover:bg-slate-800 hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            Login <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </span>
                    </button>

                    <div className="mt-8 text-sm text-slate-500">
                        Don't have an citizen account? <br />
                        <button
                            onClick={() => navigate('/register')}
                            className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline mt-1"
                        >
                            Sign up here
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
