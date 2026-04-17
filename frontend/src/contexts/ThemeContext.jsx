import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

// ЕДИНАЯ цветовая схема для всех пользователей
const themes = {
  dark: {
    name: 'Темная',
    // Основные цвета
    primary: '#8B5CF6',
    primaryDark: '#6D28D9',
    primaryLight: '#A78BFA',
    accent: '#C084FC',
    
    // Фоны
    bgPrimary: '#0B0B0F',
    bgSecondary: '#131318',
    bgTertiary: '#1A1A22',
    bgChat: '#0A0A0E',
    bgSidebar: '#111116',
    
    // Сообщения
    bgMessageOwn: '#8B5CF6',
    bgMessageOwnHover: '#7C3AED',
    bgMessageOther: '#1E1E28',
    bgMessageOtherHover: '#252532',
    
    // Текст
    textPrimary: '#FFFFFF',
    textSecondary: '#A1A1AA',
    textTertiary: '#71717A',
    
    // Границы
    borderColor: '#2A2A35',
    borderLight: '#3A3A48',
    
    // Статусы
    success: '#10B981',
    danger: '#EF4444',
    warning: '#F59E0B',
    info: '#8B5CF6',
    
    // Тени
    shadowSm: '0 1px 2px rgba(0, 0, 0, 0.3)',
    shadowMd: '0 4px 6px rgba(0, 0, 0, 0.4)',
    shadowLg: '0 10px 15px rgba(0, 0, 0, 0.5)',
    shadowGlow: '0 0 20px rgba(139, 92, 246, 0.3)',
    
    // Размытие
    blurBg: 'rgba(11, 11, 15, 0.9)',
    
    // Градиенты
    gradientPrimary: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
    gradientSecondary: 'linear-gradient(135deg, #1A1A22 0%, #131318 100%)',
    gradientGlow: 'radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.15) 0%, transparent 70%)'
  },
  
  light: {
    name: 'Светлая',
    primary: '#8B5CF6',
    primaryDark: '#6D28D9',
    primaryLight: '#A78BFA',
    accent: '#C084FC',
    
    bgPrimary: '#F8F9FC',
    bgSecondary: '#FFFFFF',
    bgTertiary: '#EEF2F6',
    bgChat: '#F0F2F5',
    bgSidebar: '#FFFFFF',
    
    bgMessageOwn: '#8B5CF6',
    bgMessageOwnHover: '#7C3AED',
    bgMessageOther: '#FFFFFF',
    bgMessageOtherHover: '#F8F9FC',
    
    textPrimary: '#1A1A1A',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    
    borderColor: '#E5E7EB',
    borderLight: '#D1D5DB',
    
    success: '#10B981',
    danger: '#EF4444',
    warning: '#F59E0B',
    info: '#8B5CF6',
    
    shadowSm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    shadowMd: '0 4px 6px rgba(0, 0, 0, 0.07)',
    shadowLg: '0 10px 15px rgba(0, 0, 0, 0.1)',
    shadowGlow: '0 0 20px rgba(139, 92, 246, 0.15)',
    
    blurBg: 'rgba(255, 255, 255, 0.9)',
    
    gradientPrimary: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
    gradientSecondary: 'linear-gradient(135deg, #FFFFFF 0%, #F8F9FC 100%)',
    gradientGlow: 'radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.08) 0%, transparent 70%)'
  }
};

export const ThemeProvider = ({ children }) => {
  // ВСЕГДА используем тёмную тему по умолчанию
  const [currentTheme, setCurrentTheme] = useState('dark');

  useEffect(() => {
    // Принудительно применяем тёмную тему при загрузке
    applyTheme('dark');
  }, []);

  const applyTheme = (themeName) => {
    const theme = themes[themeName] || themes.dark;
    const root = document.documentElement;
    
    // Применяем ВСЕ CSS переменные
    Object.entries(theme).forEach(([key, value]) => {
      if (typeof value === 'string') {
        const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
        root.style.setProperty(cssVar, value);
      }
    });
    
    // Устанавливаем data-атрибут
    root.setAttribute('data-theme', themeName);
  };

  const toggleTheme = () => {
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setCurrentTheme(newTheme);
    applyTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const setTheme = (themeName) => {
    if (themes[themeName]) {
      setCurrentTheme(themeName);
      applyTheme(themeName);
      localStorage.setItem('theme', themeName);
    }
  };

  const value = {
    theme: currentTheme,
    toggleTheme,
    setTheme,
    availableThemes: Object.keys(themes),
    themes
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};