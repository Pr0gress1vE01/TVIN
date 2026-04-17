import React from 'react';
import './ChatListSkeleton.scss';

const ChatListSkeleton = () => {
  return (
    <div className="chat-list-skeleton">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="skeleton-item">
          <div className="skeleton-avatar" />
          <div className="skeleton-content">
            <div className="skeleton-line" />
            <div className="skeleton-line short" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChatListSkeleton;