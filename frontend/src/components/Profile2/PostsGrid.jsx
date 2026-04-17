import React from 'react';
import { motion } from 'framer-motion';
import { FiImage, FiPlay, FiHeart, FiMessageCircle } from 'react-icons/fi';
import './PostsGrid.scss';

const PostsGrid = ({ posts, loading, hasMore, onLoadMore, onPostUpdate, onPostDelete, isOwnProfile }) => {
  if (loading && posts.length === 0) {
    return (
      <div className="posts-grid-loading">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="post-skeleton" />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="posts-empty">
        <FiImage size={48} />
        <h3>Нет постов</h3>
        <p>Здесь пока ничего нет</p>
      </div>
    );
  }

  return (
    <div className="posts-grid">
      {posts.map((post, index) => (
        <motion.div
          key={post._id}
          className="post-card"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          whileHover={{ scale: 1.02 }}
        >
          <div className="post-media">
            {post.media?.[0]?.type === 'image' ? (
              <img src={post.media[0].url} alt="" />
            ) : post.media?.[0]?.type === 'video' ? (
              <>
                <video src={post.media[0].url} />
                <div className="video-indicator">
                  <FiPlay />
                </div>
              </>
            ) : (
              <div className="post-placeholder">
                <FiImage />
              </div>
            )}
            
            {post.media?.length > 1 && (
              <div className="multiple-indicator">
                <FiImage /> {post.media.length}
              </div>
            )}
          </div>

          <div className="post-overlay">
            <div className="post-stats">
              <span><FiHeart /> {post.likes?.length || 0}</span>
              <span><FiMessageCircle /> {post.comments?.length || 0}</span>
            </div>
          </div>

          {isOwnProfile && (
            <div className="post-actions">
              <button onClick={() => onPostUpdate(post)}>✏️</button>
              <button onClick={() => onPostDelete(post._id)}>🗑️</button>
            </div>
          )}
        </motion.div>
      ))}

      {hasMore && (
        <button className="load-more-btn" onClick={onLoadMore}>
          Загрузить ещё
        </button>
      )}
    </div>
  );
};

export default PostsGrid;