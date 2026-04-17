import React, { useMemo } from 'react';
import './MessageReactions.scss';

const MessageReactions = ({ reactions, messageId, userId, onAddReaction }) => {
  const grouped = useMemo(() => {
    if (!reactions?.length) return {};
    
    return reactions.reduce((acc, r) => {
      const emoji = r.emoji;
      if (!acc[emoji]) acc[emoji] = { emoji, count: 0, hasUser: false };
      acc[emoji].count++;
      const rUserId = typeof r.user === 'object' ? r.user._id : r.user;
      if (rUserId === userId) acc[emoji].hasUser = true;
      return acc;
    }, {});
  }, [reactions, userId]);

  if (!Object.keys(grouped).length) return null;

  return (
    <div className="message-reactions">
      {Object.entries(grouped).map(([emoji, data]) => (
        <button
          key={emoji}
          className={`reaction-badge ${data.hasUser ? 'active' : ''}`}
          onClick={(e) => { e.stopPropagation(); onAddReaction(messageId, emoji); }}
        >
          <span className="reaction-emoji">{emoji}</span>
          <span className="reaction-count">{data.count}</span>
        </button>
      ))}
    </div>
  );
};

export default React.memo(MessageReactions);