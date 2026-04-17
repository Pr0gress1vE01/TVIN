import React from 'react';
import { FiMessageCircle, FiFolderPlus } from 'react-icons/fi';
import './ChatListFolders.scss';

const ChatListFolders = ({ activeFolder, onSelectFolder, unreadCount }) => {
  const folders = [
    { id: 'all', label: 'Все', icon: FiMessageCircle },
    { id: 'unread', label: 'Непрочитанные', icon: FiMessageCircle, badge: unreadCount },
  ];

  return (
    <div className="chat-list-folders">
      {folders.map(folder => (
        <button
          key={folder.id}
          className={`folder-btn ${activeFolder === folder.id ? 'active' : ''}`}
          onClick={() => onSelectFolder(folder.id)}
        >
          <folder.icon />
          <span>{folder.label}</span>
          {folder.badge > 0 && (
            <span className="folder-badge">{folder.badge}</span>
          )}
        </button>
      ))}
      <button className="folder-btn add-folder" title="Добавить папку">
        <FiFolderPlus />
      </button>
    </div>
  );
};

export default React.memo(ChatListFolders);