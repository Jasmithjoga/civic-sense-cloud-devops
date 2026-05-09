import React, { createContext, useContext, useCallback } from 'react';
import { MOCK_COMPLAINTS } from '../data/mockData';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { normalizeComplaint } from '../utils/helpers';

const AppContext = createContext(null);

export function AppProvider({ children }) {
    const [role, setRole] = useLocalStorage('civic_role', 'citizen');
    const [darkMode, setDarkMode] = useLocalStorage('civic_dark', false);
    const [userComplaints, setUserComplaints] = useLocalStorage('civic_complaints', []);
    const [authUser, setAuthUser] = useLocalStorage('civic_user', null);

    // Merge mock + user complaints, user complaints take precedence for updates
    // Use only user complaints, remove mock data
    const allComplaints = React.useMemo(() => {
        const deduped = userComplaints.reduce((acc, curr) => {
            const id = curr.complaintId || curr.id;
            if (id) acc[id] = normalizeComplaint(curr);
            return acc;
        }, {});
        return Object.values(deduped);
    }, [userComplaints]);

    // Apply dark mode class to <html>
    React.useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);

    const toggleDarkMode = useCallback(() => setDarkMode((d) => !d), [setDarkMode]);

    const toggleRole = useCallback(() => {
        setRole((r) => {
            const next = r === 'citizen' ? 'admin' : 'citizen';
            toast.success(`Switched to ${next === 'admin' ? '🔐 Admin' : '👤 Citizen'} mode`);
            return next;
        });
    }, [setRole]);

    // ── Auth ─────────────────────────────────────────────────────────────────
    const loginUser = useCallback(async (email, password) => {
        const data = await authAPI.login({ email, password });
        localStorage.setItem('civic_token', data.token);
        setAuthUser(data.user);
        setRole(data.user.role);
        toast.success(`Welcome back, ${data.user.name}! 👋`);
        return data;
    }, [setAuthUser, setRole]);

    const registerUser = useCallback(async (name, email, password, adminCode) => {
        const body = { name, email, password };
        if (adminCode) { body.role = 'admin'; body.adminSecret = adminCode; }
        const data = await authAPI.register(body);
        localStorage.setItem('civic_token', data.token);
        setAuthUser(data.user);
        setRole(data.user.role);
        toast.success(`Account created! Welcome, ${data.user.name} 🎉`);
        return data;
    }, [setAuthUser, setRole]);

    const logoutUser = useCallback(() => {
        localStorage.removeItem('civic_token');
        setAuthUser(null);
        setRole('citizen');
        toast.success('Logged out successfully');
    }, [setAuthUser, setRole]);

    // ── Complaint CRUD (local + localStorage) ─────────────────────────────────
    const addComplaint = useCallback(
        (complaint) => {
            setUserComplaints((prev) => {
                const exists = prev.find((c) => (c.complaintId || c.id) === (complaint.complaintId || complaint.id));
                if (exists) {
                    return prev.map((c) => (c.complaintId || c.id) === (complaint.complaintId || complaint.id) ? { ...c, ...complaint } : c);
                }
                return [complaint, ...prev];
            });
        },
        [setUserComplaints]
    );

    const updateComplaint = useCallback(
        (id, updates) => {
            setUserComplaints((prev) => {
                const exists = prev.find((c) => c.id === id);
                if (exists) {
                    return prev.map((c) => (c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c));
                } else {
                    const mock = MOCK_COMPLAINTS.find((c) => c.id === id);
                    if (mock) {
                        return [{ ...mock, ...updates, updatedAt: new Date().toISOString() }, ...prev];
                    }
                    return prev;
                }
            });
        },
        [setUserComplaints]
    );

    const upvoteComplaint = useCallback(
        (id) => {
            setUserComplaints((prev) => {
                const exists = prev.find((c) => c.id === id);
                if (exists) {
                    return prev.map((c) => (c.id === id ? { ...c, upvotes: (c.upvotes || 0) + 1 } : c));
                } else {
                    const mock = MOCK_COMPLAINTS.find((c) => c.id === id);
                    if (mock) {
                        return [{ ...mock, upvotes: (mock.upvotes || 0) + 1 }, ...prev];
                    }
                    return prev;
                }
            });
            toast.success('Upvoted! Thanks for confirming this issue.');
        },
        [setUserComplaints]
    );

    const getComplaintById = useCallback(
        (id) => allComplaints.find((c) => c.id === id) || null,
        [allComplaints]
    );

    return (
        <AppContext.Provider
            value={{
                role,
                toggleRole,
                darkMode,
                toggleDarkMode,
                complaints: allComplaints,
                addComplaint,
                updateComplaint,
                upvoteComplaint,
                getComplaintById,
                // Auth
                authUser,
                isAuthenticated: !!authUser,
                loginUser,
                registerUser,
                logoutUser,
            }}
        >
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useApp must be used within AppProvider');
    return ctx;
}
