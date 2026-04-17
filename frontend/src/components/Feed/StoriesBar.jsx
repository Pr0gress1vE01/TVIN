import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import './StoriesBar.scss';

const StoriesBar = ({ stories = [] }) => {
  const { user } = useAuth();
  const [scrollPosition, setScrollPosition] = useState(0);

  const handleScroll = (direction) => {
    const container = document.querySelector('.stories-list');
    const scrollAmount = 200;
    
    if (direction === 'left') {
      container.scrollLeft -= scrollAmount;
    } else {
      container.scrollLeft += scrollAmount;
    }
    
    setScrollPosition(container.scrollLeft);
  };

  return (
    <div className="stories-bar">
      <div className="stories-list">
        <div className="story-item create-story">
          <div className="story-avatar">
            <img src={user?.avatar || '/default-avatar.svg'} alt="" />
            <div className="add-icon">
              <FiPlus />
            </div>
          </div>
          <span className="story-name">Создать</span>
        </div>
        {stories.map(story => (
          <motion.div 
            key={story._id}
            className="story-item"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="story-avatar">
              <img src={story.user.avatar} alt="" />
            </div>
            <span className="story-name">{story.user.username}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default StoriesBar;