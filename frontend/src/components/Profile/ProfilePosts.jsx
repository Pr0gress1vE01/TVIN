import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { FiHeart, FiMessageCircle, FiPlay } from 'react-icons/fi';
import './ProfilePosts.scss';

const ProfilePosts = ({ userId, type = 'posts' }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [likedPosts, setLikedPosts] = useState(new Set());

  useEffect(() => {
    fetchPosts();
  }, [userId, type]);

  const fetchPosts = async (pageNum = 1) => {
    try {
      setLoading(true);
      const endpoint = type === 'reels' 
        ? `/api/user/${userId}/reels`
        : `/api/user/${userId}/posts`;
      
      const response = await axios.get(endpoint, {
        params: { page: pageNum, limit: 12 }
      });
      
      if (pageNum === 1) {
        setPosts(response.data.posts);
      } else {
        setPosts(prev => [...prev, ...response.data.posts]);
      }
      
      setHasMore(response.data.hasMore);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDoubleTap = async (postId) => {
    if (likedPosts.has(postId)) return;
    
    try {
      await axios.post(`/api/post/${postId}/like`);
      setLikedPosts(prev => new Set([...prev, postId]));
      setPosts(prev => prev.map(p => 
        p._id === postId ? { ...p, likes: (p.likes || 0) + 1 } : p
      ));
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPosts(nextPage);
    }
  }, [loading, hasMore, page]);

  if (loading && posts.length === 0) {
    return (
      <div className="posts-grid-loading">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="skeleton-post" />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="empty-posts">
        <p>Нет постов</p>
      </div>
    );
  }

  return (
    <div className="profile-posts">
      <div className="posts-grid">
        {posts.map((post, index) => (
          <PostCard
            key={post._id}
            post={post}
            index={index}
            type={type}
            isLiked={likedPosts.has(post._id)}
            onDoubleTap={handleDoubleTap}
          />
        ))}
      </div>
      
      {hasMore && (
        <button 
          className="load-more-btn"
          onClick={handleLoadMore}
          disabled={loading}
        >
          {loading ? 'Загрузка...' : 'Показать ещё'}
        </button>
      )}
    </div>
  );
};

const PostCard = ({ post, type, isLiked, onDoubleTap }) => {
  const [lastTap, setLastTap] = useState(0);
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);

  const handleClick = (e) => {
    const now = Date.now();
    if (now - lastTap < 300) {
      onDoubleTap(post._id);
      setShowLikeAnimation(true);
      setTimeout(() => setShowLikeAnimation(false), 500);
    }
    setLastTap(now);
  };

  return (
    <div className="grid-item" onClick={handleClick}>
      {post.media?.[0]?.type === 'image' ? (
        <img src={post.media[0].url} alt="" loading="lazy" />
      ) : (
        <video src={post.media[0]?.url} muted />
      )}
      
      {type === 'reels' && (
        <div className="reels-badge">
          <FiPlay /> {post.views || 0}
        </div>
      )}
      
      <div className="hover-overlay">
        <span><FiHeart fill={isLiked ? '#ed4956' : 'none'} color={isLiked ? '#ed4956' : '#fff'} /> {post.likes || 0}</span>
        <span><FiMessageCircle /> {post.commentsCount || 0}</span>
      </div>
      
      <AnimatePresence>
        {showLikeAnimation && (
          <motion.div
            className="like-animation"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1.5, opacity: 1 }}
            exit={{ scale: 2, opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <FiHeart fill="#fff" color="#fff" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfilePosts;