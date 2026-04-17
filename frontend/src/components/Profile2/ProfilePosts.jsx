import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PostCard from '../Post/PostCard';
import './ProfilePosts.scss';

const ProfilePosts = ({ userId, isOwnProfile }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, [userId]);

  const fetchPosts = async (pageNum = 1) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/user/${userId}/posts`, {
        params: { page: pageNum, limit: 10 }
      });
      
      if (pageNum === 1) {
        setPosts(response.data.posts);
      } else {
        setPosts(prev => [...prev, ...response.data.posts]);
      }
      
      setHasMore(response.data.posts.length === 10);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPosts(nextPage);
    }
  };

  if (loading && posts.length === 0) {
    return (
      <div className="posts-loading">
        <div className="spinner" />
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
      {posts.map(post => (
        <PostCard key={post._id} post={post} />
      ))}
      
      {hasMore && (
        <button className="load-more-btn" onClick={loadMore} disabled={loading}>
          {loading ? 'Загрузка...' : 'Показать ещё'}
        </button>
      )}
    </div>
  );
};

export default ProfilePosts;