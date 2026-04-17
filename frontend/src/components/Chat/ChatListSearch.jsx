import React from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import './ChatListSearch.scss';

const ChatListSearch = ({ value, onChange }) => {
  const handleClear = () => {
    onChange('');
  };

  return (
    <div className="chat-list-search">
      <FiSearch className="search-icon" />
      <input
        type="text"
        placeholder="Поиск чатов..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button className="clear-btn" onClick={handleClear}>
          <FiX />
        </button>
      )}
    </div>
  );
};

export default React.memo(ChatListSearch);