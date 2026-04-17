import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiEdit3, FiCamera, FiImage, FiVideo } from 'react-icons/fi';
import CreatePostModal from './CreatePostModal';
import './CreateBar.scss';

const CreateBar = ({ onPostCreated, hasStories, onStoryClick }) => {
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showStoryCreator, setShowStoryCreator] = useState(false);

  const actions = [
    { icon: FiEdit3, label: 'Пост', onClick: () => setShowCreatePost(true), color: '#0088cc' },
    { icon: FiCamera, label: 'История', onClick: () => setShowStoryCreator(true), color: '#e4405f' },
    { icon: FiImage, label: 'Фото', onClick: () => setShowCreatePost(true), color: '#4cd964' },
    { icon: FiVideo, label: 'Видео', onClick: () => setShowStoryCreator(true), color: '#ffcc00' }
  ];

  return (
    <>
      <motion.div 
        className="create-bar"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="create-bar__avatar" onClick={onStoryClick}>
          <img src={localStorage.getItem('userAvatar') || '/default-avatar.svg'} alt="" />
          {hasStories && <div className="story-ring" />}
          <div className="add-icon">+</div>
        </div>

        <div className="create-bar__actions">
          {actions.map((action, index) => (
            <motion.button
              key={index}
              className="action-btn"
              onClick={action.onClick}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{ color: action.color }}
            >
              <action.icon />
              <span>{action.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      <CreatePostModal 
        isOpen={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        onPostCreated={onPostCreated}
      />
    </>
  );
};

export default CreateBar;