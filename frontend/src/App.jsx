import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './lib/queryClient';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { DiagnosticsProvider } from './contexts/DiagnosticsContext';
import { ProfileProvider } from './contexts/ProfileContext';
import PrivateRoute from './components/common/PrivateRoute';
import Layout from './components/Layout';
import ProfileSlidePanel from './components/Profile/ProfileSlidePanel';
import Login from './pages/Login';
import Register from './pages/Register';
import Chat from './pages/Chat';
import Feed from './pages/Feed';
import Settings from './pages/Settings';
import AdminPanel from './pages/admin/AdminPanel';
import './styles/global.scss';
import { NotificationProvider } from './contexts/NotificationContext';

const AppContent = () => (
  <>
    <AnimatePresence mode="wait">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<PrivateRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/feed" replace />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/chat/:chatId" element={<Chat />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          <Route path="/admin/*" element={<AdminPanel />} />
        </Route>
        <Route path="*" element={<Navigate to="/feed" replace />} />
      </Routes>
    </AnimatePresence>
    <ProfileSlidePanel />
  </>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <DiagnosticsProvider>
              <NotificationProvider>
              <ProfileProvider>
                <AppContent />
              </ProfileProvider>
              </NotificationProvider>
            </DiagnosticsProvider>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
    {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
  </QueryClientProvider>
);

export default App;