import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import PostCard from '../components/Post/PostCard';
import CreatePost from '../components/Post/CreatePost';
import StoriesBar from '../components/Feed/StoriesBar';
import SuggestionsSidebar from '../components/Feed/SuggestionsSidebar';
import { FiRefreshCw } from 'react-icons/fi';
import './Feed.scss';
import { useProfile } from '../contexts/ProfileContext';
import { useSocket } from '../hooks/useSocket';

const Feed = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [stories, setStories] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const { openProfile } = useProfile();

  // Внутри компонента:
const { socket, connected } = useSocket();

useEffect(() => {
  if (!socket) return;
  
  const handleNewPost = (post) => {
    setPosts(prev => [post, ...prev]);
  };
  
  const handlePostUpdate = (updatedPost) => {
    setPosts(prev => prev.map(p => p._id === updatedPost._id ? updatedPost : p));
  };
  
  const handlePostDelete = (postId) => {
    setPosts(prev => prev.filter(p => p._id !== postId));
  };
  
  socket.on('post:new', handleNewPost);
  socket.on('post:update', handlePostUpdate);
  socket.on('post:delete', handlePostDelete);
  
  return () => {
    socket.off('post:new', handleNewPost);
    socket.off('post:update', handlePostUpdate);
    socket.off('post:delete', handlePostDelete);
  };
}, [socket]);


  useEffect(() => {
    fetchFeed();
    fetchStories();
    fetchSuggestions();
  }, []);

  const fetchFeed = async (pageNum = 1, refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await axios.get('/api/post/feed', {
        params: { page: pageNum, limit: 10 }
      });

      if (pageNum === 1) {
        setPosts(response.data);
      } else {
        setPosts(prev => [...prev, ...response.data]);
      }

      setHasMore(response.data.length === 10);
    } catch (error) {
      console.error('Error fetching feed:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchStories = async () => {
    try {
      const response = await axios.get('/api/stories');
      setStories(response.data);
    } catch (error) {
      console.error('Error fetching stories:', error);
    }
  };

  const fetchSuggestions = async () => {
    try {
      const response = await axios.get('/api/contacts/suggestions');
      setSuggestions(response.data);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const handleRefresh = () => {
    setPage(1);
    fetchFeed(1, true);
    fetchStories();
  };

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchFeed(nextPage);
    }
  }, [loading, hasMore, page]);

  const handlePostCreated = (newPost) => {
    setPosts(prev => [newPost, ...prev]);
  };

  const handlePostUpdate = (updatedPost) => {
    setPosts(prev => prev.map(p => 
      p._id === updatedPost._id ? updatedPost : p
    ));
  };

   const handleAuthorClick = (author) => {
    openProfile(author);
  };

  const handlePostDelete = (postId) => {
    setPosts(prev => prev.filter(p => p._id !== postId));
  };

  return (
    <motion.div 
      className="feed-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="feed-container">
        <div className="feed-main">
          <div className="feed-header">
            <h1>Новости</h1>
            <button 
              className={`refresh-btn ${refreshing ? 'spinning' : ''}`}
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <FiRefreshCw />
            </button>
          </div>

          <StoriesBar stories={stories} />
          
          <CreatePost onPostCreated={handlePostCreated} />

          <div className="posts-feed">
            {loading && posts.length === 0 ? (
              <div className="posts-loading">
                {[1, 2, 3].map(i => (
                  <div key={i} className="post-skeleton" />
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="empty-feed">
                <img src="/empty-feed.svg" alt="Empty feed" />
                <h3>Пока нет постов</h3>
                <p>Добавьте друзей или создайте свой первый пост</p>
              </div>
            ) : (
              <>
                {posts.map(post => (
                  <PostCard 
                    key={post._id} 
                    post={post}
                    onUpdate={handlePostUpdate}
                    onDelete={handlePostDelete}
                    onAuthorClick={handleAuthorClick}
                  />
                ))}
                
                {hasMore && (
                  <button 
                    className="load-more-btn"
                    onClick={loadMore}
                    disabled={loading}
                  >
                    {loading ? 'Загрузка...' : 'Загрузить ещё'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        <div className="feed-sidebar">
          <div className="user-profile-card">
            <div className="user-info">
              <img src={user?.avatar || '/default-avatar.svg'} alt="" />
              <div>
                <h4>{user?.username}</h4>
                <p>{user?.firstName} {user?.lastName}</p>
              </div>
            </div>
          </div>

          <SuggestionsSidebar 
            suggestions={suggestions}
            onFollow={(userId) => {
              setSuggestions(prev => prev.filter(s => s._id !== userId));
            }}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default Feed;