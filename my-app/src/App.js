import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppProvider } from './context/AppContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import LandingPage from './pages/LandingPage';
import ReportIssuePage from './pages/ReportIssuePage';
import TrackComplaintPage from './pages/TrackComplaintPage';
import MapViewPage from './pages/MapViewPage';
import AdminDashboard from './pages/AdminDashboard';
import AnalyticsPage from './pages/AnalyticsPage';
import SuccessPage from './pages/SuccessPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AuthSelectionPage from './pages/AuthSelectionPage';
import CursorGlow from './components/ui/CursorGlow';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
          <CursorGlow />
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/report" element={<ReportIssuePage />} />
              <Route path="/track" element={<TrackComplaintPage />} />
              <Route path="/track/:id" element={<TrackComplaintPage />} />
              <Route path="/map" element={<MapViewPage />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/success/:id" element={<SuccessPage />} />
              <Route path="/login" element={<AuthSelectionPage />} />
              <Route path="/login/form" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                borderRadius: '12px',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                fontWeight: '500',
              },
            }}
          />
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
