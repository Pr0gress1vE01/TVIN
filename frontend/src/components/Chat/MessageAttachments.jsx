import React from 'react';
import VoiceMessagePlayer from './VoiceMessagePlayer';
import VideoMessagePlayer from './VideoMessagePlayer';
import './MessageAttachments.scss';

const MessageAttachments = ({ message, attachments, isOwn, chatSettings }) => {
  if (!attachments?.length) return null;

  // Голосовое
  if (message.type === 'voice' && attachments[0]) {
    return (
      <VoiceMessagePlayer 
        audioUrl={attachments[0].url} 
        duration={attachments[0].duration}
        isOwn={isOwn} 
      />
    );
  }

  // Видео-кружок
  if (message.type === 'video_message' && attachments[0]) {
    return (
      <VideoMessagePlayer 
        videoUrl={attachments[0].url}
        isOwn={isOwn}
        duration={attachments[0].duration}
      />
    );
  }

  // Стикер
  if (message.type === 'sticker' && attachments[0]) {
    return (
      <img 
        src={attachments[0].url} 
        alt="Sticker" 
        style={{ width: '128px', height: '128px', objectFit: 'contain' }}
      />
    );
  }

  // Одиночное изображение
  if (message.type === 'image' && attachments.length === 1) {
    return (
      <div className="media-container">
        <img 
          src={attachments[0].url} 
          alt="" 
          onClick={() => window.open(attachments[0].url, '_blank')}
          style={{ maxWidth: '300px', maxHeight: '300px', borderRadius: '16px', cursor: 'pointer' }}
        />
      </div>
    );
  }

  // Множественные изображения
  if (message.type === 'image' && attachments.length > 1) {
    const gridSize = Math.min(attachments.length, 4);
    return (
      <div className={`media-grid media-grid--${gridSize}`}>
        {attachments.slice(0, 4).map((att, i) => (
          <div key={i} className="media-grid-item" onClick={() => window.open(att.url, '_blank')}>
            <img src={att.url} alt="" />
            {i === 3 && attachments.length > 4 && (
              <div className="more-overlay">
                <span>+{attachments.length - 4}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  // Одиночное видео
  if (message.type === 'video' && attachments.length === 1) {
    return (
      <div className="media-container">
        <video 
          src={attachments[0].url} 
          controls 
          preload="metadata"
          style={{ maxWidth: '300px', maxHeight: '300px', borderRadius: '16px' }}
        />
      </div>
    );
  }

  // Файлы
  if (message.type === 'file') {
    return (
      <div className="message__bubble message__bubble--file" style={{
        borderRadius: `${chatSettings?.bubbleRadius || 16}px`,
        fontSize: chatSettings?.fontSize === 'small' ? '13px' : '15px'
      }}>
        {attachments.length === 1 ? (
          <a href={attachments[0].url} target="_blank" rel="noopener noreferrer">
            📎 {attachments[0].filename || 'Файл'}
            {attachments[0].size && (
              <span className="file-size">({Math.round(attachments[0].size / 1024)} KB)</span>
            )}
          </a>
        ) : (
          <div className="multiple-files">
            <span>📎 Прикреплено файлов: {attachments.length}</span>
            {attachments.map((att, i) => (
              <a key={i} href={att.url} target="_blank" rel="noopener noreferrer" className="file-link">
                {att.filename || `Файл ${i + 1}`}
              </a>
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default MessageAttachments;