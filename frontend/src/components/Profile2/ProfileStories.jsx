import React from 'react';
import { motion } from 'framer-motion';
import { FiPlus } from 'react-icons/fi';
import './ProfileStories.scss';

const ProfileStories = ({ stories, isOwnProfile, onAddStory }) => {
  if (!stories.length && !isOwnProfile) return null;

  return (
    <motion.div 
      className="profile-stories"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
    >
      <div className="stories-header">
        <h3>Истории</h3>
        {isOwnProfile && stories.length > 0 && (
          <button className="archive-btn">Архив</button>
        )}
      </div>

      <div className="stories-list">
        {isOwnProfile && (
          <motion.div 
            className="story-item add-story"
            onClick={onAddStory}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="story-preview">
              <FiPlus />
            </div>
            <span>Добавить</span>
          </motion.div>
        )}

        {stories.map(story => (
          <motion.div 
            key={story._id}
            className="story-item"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="story-preview">
              <img src={story.preview || story.media} alt="" />
            </div>
            <span>{story.views} просмотров</span>
          </motion.div>
        ))}

        {!isOwnProfile && stories.length === 0 && (
          <p className="no-stories">Нет активных историй</p>
        )}
      </div>
    </motion.div>
  );
};

export default ProfileStories;