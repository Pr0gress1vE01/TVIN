import React from 'react';
import { FiEdit, FiUserPlus, FiUsers } from 'react-icons/fi';
import './ChatListHeader.scss';

const ChatListHeader = ({ totalUnread, onNewChat, onNewGroup, onAddContact }) => {
  return (
    <div className="chat-list-header">
      <div className="header-title">
        <h2>Сообщения</h2>
        {totalUnread > 0 && (
          <span className="total-unread-badge">{totalUnread}</span>
        )}
      </div>
      
      <div className="header-actions">
        <button className="icon-button" title="Новый чат" onClick={onNewChat}>
          <FiEdit />
        </button>
        <button className="icon-button" title="Создать группу" onClick={onNewGroup}>
          <FiUsers />
        </button>
        <button className="icon-button" title="Добавить контакт" onClick={onAddContact}>
          <FiUserPlus />
        </button>
      </div>
    </div>
  );
};

export default React.memo(ChatListHeader);