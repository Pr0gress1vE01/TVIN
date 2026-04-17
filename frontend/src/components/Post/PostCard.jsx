import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { 
  FiHeart, 
  FiMessageCircle, 
  FiShare2, 
  FiBookmark,
  FiMoreHorizontal
} from 'react-icons/fi';
import './PostCard.scss';

const PostCard = ({ post, onUpdate, onAuthorClick }) => {
  const { user } = useAuth();
  const [liked, setLiked] = useState(post.likes?.includes(user?._id));
  const [likesCount, setLikesCount] = useState(post.likes?.length || 0);
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState(post.comments || []);

  const handleLike = async () => {
    try {
      const response = await axios.post(`/api/post/${post._id}/like`);
      setLiked(response.data.liked);
      setLikesCount(response.data.likes);
      onUpdate?.();
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleAuthorClick = (author) => {
    openProfile(author);
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    try {
      const response = await axios.post(`/api/post/${post._id}/comments`, {
        content: comment
      });
      setComments([...comments, response.data]);
      setComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  return (
    <motion.div 
      className="post-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
    >
      <div className="post-header" onClick={() => onAuthorClick?.(post.author)}>
        <Link className="post-author">
          <img src={post.author.avatar} alt={post.author.username} />
          <div className="author-info">
            <span className="author-name">{post.author.username}</span>
            <span className="post-time">
              {formatDistanceToNow(new Date(post.createdAt), {
                addSuffix: true,
                locale: ru
              })}
            </span>
          </div>
        </Link>
        <button className="icon-button">
          <FiMoreHorizontal />
        </button>
      </div>

      {post.content && (
        <div className="post-content">
          <p>{post.content}</p>
        </div>
      )}

      {post.media && post.media.length > 0 && (
        <div className="post-media">
          {post.media.map((item, index) => (
            <div key={index} className="media-item">
              {item.type === 'image' ? (
                <img src={item.url} alt="" loading="lazy" />
              ) : (
                <video src={item.url} controls />
              )}
            </div>
          ))}
        </div>
      )}

      <div className="post-stats">
        <span>{likesCount} лайков</span>
        <span>{comments.length} комментариев</span>
      </div>

      <div className="post-actions">
        <button 
          className={`action-btn ${liked ? 'liked' : ''}`}
          onClick={handleLike}
        >
          <FiHeart /> Лайк
        </button>
        <button 
          className="action-btn"
          onClick={() => setShowComments(!showComments)}
        >
          <FiMessageCircle /> Комментировать
        </button>
        <button className="action-btn">
          <FiShare2 /> Поделиться
        </button>
        <button className="action-btn">
          <FiBookmark /> Сохранить
        </button>
      </div>

      {showComments && (
        <div className="post-comments">
          <form onSubmit={handleComment} className="comment-form">
            <input
              type="text"
              placeholder="Написать комментарий..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <button type="submit" disabled={!comment.trim()}>
              Отправить
            </button>
          </form>

          <div className="comments-list">
            {comments.map((comment, index) => (
              <div key={index} className="comment-item">
                <Link to={`/profile/${comment.author._id}`}>
                  <img src={comment.author.avatar} alt="" />
                </Link>
                <div className="comment-content">
                  <Link to={`/profile/${comment.author._id}`} className="comment-author">
                    {comment.author.username}
                  </Link>
                  <p>{comment.content}</p>
                  <span className="comment-time">
                    {formatDistanceToNow(new Date(comment.createdAt), {
                      addSuffix: true,
                      locale: ru
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default PostCard;