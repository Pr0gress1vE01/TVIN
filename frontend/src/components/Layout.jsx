import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useProfile } from '../contexts/ProfileContext';
import { useDiagnostics } from '../contexts/DiagnosticsContext';
import { 
  FiMessageCircle, FiUser, FiSettings, FiLogOut,
  FiSun, FiMoon, FiMenu, FiX, FiHome, FiUsers, FiShield,
  FiActivity
} from 'react-icons/fi';
import './Layout.scss';
import ConnectionStatus from '../components/UI/ConnectionStatus';

const Layout = () => {
  
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isOpen: isProfileOpen } = useProfile();
  const { diagnostics } = useDiagnostics();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleProfileClick = () => {
    // Профиль теперь открывается через ProfileContext
    // Этот обработчик используется только если нужна дополнительная логика
  };

  

  const navItems = [
    { path: '/feed', icon: FiHome, label: 'Новости' },
    { path: '/chat', icon: FiMessageCircle, label: 'Чаты' },
    { path: '/contacts', icon: FiUsers, label: 'Контакты' },
  ];

  if (user?.role === 'admin') {
    navItems.push({ path: '/admin', icon: FiShield, label: 'Админ' });
  }

  navItems.push(
    { path: '/settings', icon: FiSettings, label: 'Настройки' }
  );

  return (
    <div className={`layout ${isProfileOpen ? 'profile-open' : ''}`}>
      <button 
        className="mobile-menu-toggle"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? <FiX /> : <FiMenu />}
      </button>
      <ConnectionStatus />
      <AnimatePresence>
        {(mobileMenuOpen || window.innerWidth > 768) && (
          <motion.nav 
            className="sidebar"
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="sidebar__header">
              <div className="logo">
                <img src="/tvin-logo.svg" alt="TVIN" />
                <span>TVIN</span>
              </div>
              
              {diagnostics && (
                <div className="status-indicator">
                  <span className={`dot ${diagnostics.status === 'healthy' ? 'online' : 'offline'}`} />
                  <span className="status-text">
                    {diagnostics.status === 'healthy' ? 'Онлайн' : 'Проблемы'}
                  </span>
                </div>
              )}
            </div>

            <div 
              className="sidebar__user"
              onClick={() => {
                // Здесь будет открываться профиль текущего пользователя
                // Пока оставляем навигацию на старую страницу
                navigate('/profile');
                setMobileMenuOpen(false);
              }}
            >
              <img src={user?.avatar || '/default-avatar.svg'} alt={user?.username} />
              <div className="user-info">
                <h4>{user?.firstName} {user?.lastName}</h4>
                <p>@{user?.username}</p>
                {user?.role === 'admin' && (
                  <span className="admin-badge">
                    <FiShield /> Администратор
                  </span>
                )}
              </div>
            </div>

            <ul className="sidebar__nav">
              {navItems.map(item => (
                <li key={item.path}>
                  <NavLink 
                    to={item.path}
                    className={({ isActive }) => isActive ? 'active' : ''}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>

            <div className="sidebar__footer">
              <button 
                className="theme-toggle"
                onClick={toggleTheme}
              >
                {theme === 'dark' ? <FiSun /> : <FiMoon />}
                <span>{theme === 'dark' ? 'Светлая тема' : 'Темная тема'}</span>
              </button>
              
              <button 
                className="logout-btn"
                onClick={handleLogout}
              >
                <FiLogOut />
                <span>Выйти</span>
              </button>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;