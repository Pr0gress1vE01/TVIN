import React, { createContext, useContext, useState, useCallback } from 'react';

const ProfileContext = createContext();

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) throw new Error('useProfile must be used within ProfileProvider');
  return context;
};

export const ProfileProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const openProfile = useCallback((user) => {
    setProfileUser(user);
    setIsOpen(true);
    document.body.style.overflow = 'hidden';
  }, []);

  const closeProfile = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => setProfileUser(null), 300);
    document.body.style.overflow = '';
  }, []);

  return (
    <ProfileContext.Provider value={{
      isOpen,
      profileUser,
      loading,
      openProfile,
      closeProfile,
      setLoading
    }}>
      {children}
    </ProfileContext.Provider>
  );
};