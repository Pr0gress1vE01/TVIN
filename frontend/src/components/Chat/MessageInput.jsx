import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../contexts/AuthContext';
import VoiceRecorder from './VoiceRecorder';
import VideoRecorder from './VideoRecorder';
import { 
  FiSmile, FiPlus, FiMic, FiCamera, FiSend, FiX, 
  FiImage, FiFile, FiMapPin, FiMusic, FiBarChart2 
} from 'react-icons/fi';
import './MessageInput.scss';

const MessageInput = ({ onSendMessage, chatId, replyTo, editingMessage, onCancelEdit, isGroup = false }) => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);
  const [inputMode, setInputMode] = useState('mic');
  const [uploading, setUploading] = useState(false);
  
  const textareaRef = useRef(null);
  const pressTimerRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const { getRootProps, getInputProps } = useDropzone({
    accept: { 
      'image/*': [], 
      'video/*': [], 
      'application/pdf': [], 
      'application/msword': [], 
      'text/plain': [] 
    },
    noClick: true,
    noKeyboard: true,
    onDrop: (files) => {
      const newAttachments = files.map(f => ({
        file: f,
        preview: f.type.startsWith('image') ? URL.createObjectURL(f) : null,
        type: f.type.startsWith('image') ? 'image' : f.type.startsWith('video') ? 'video' : 'file',
        name: f.name,
        size: f.size
      }));
      setAttachments(prev => [...prev, ...newAttachments]);
    }
  });

  useEffect(() => {
    if (editingMessage) {
      setMessage(editingMessage.content || '');
      textareaRef.current?.focus();
    }
  }, [editingMessage]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
        setShowEmoji(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSend = useCallback(async () => {
    if (!message.trim() && attachments.length === 0) return;
    
    // Если есть вложения
    if (attachments.length > 0) {
      setUploading(true);
      const allAttachments = [...attachments];
      setAttachments([]);
      
      try {
        const formData = new FormData();
        allAttachments.forEach(item => formData.append('files', item.file));
        
        const response = await axios.post('/api/upload/chat', formData);
        
        const files = response.data.files;
        let messageType = 'file';
        
        if (files.length === 1) {
          if (files[0].type === 'image') messageType = 'image';
          else if (files[0].type === 'video') messageType = 'video';
          else if (files[0].type === 'audio') messageType = 'audio';
        } else {
          const allImages = files.every(f => f.type === 'image');
          const allVideos = files.every(f => f.type === 'video');
          if (allImages) messageType = 'image';
          else if (allVideos) messageType = 'video';
        }
        
        onSendMessage(
          message.trim(),
          messageType,
          files.map(f => ({
            url: f.url,
            type: f.type,
            filename: f.filename,
            name: f.name || f.filename,
            size: f.size
          })),
          replyTo?._id
        );
        
        setMessage('');
      } catch (error) {
        console.error('Upload error:', error);
      } finally {
        setUploading(false);
        allAttachments.forEach(a => a.preview && URL.revokeObjectURL(a.preview));
      }
      return;
    }
    
    // Только текст
    if (message.trim()) {
      onSendMessage(message, 'text', [], replyTo?._id);
      setMessage('');
    }
    
    setShowEmoji(false);
    onCancelEdit?.();
  }, [message, attachments, replyTo, onSendMessage, onCancelEdit]);

  const handleTyping = useCallback(() => {
    if (!socket || !chatId) return;
    
    socket.emit('typing:start', { chatId });
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing:stop', { chatId });
    }, 3000);
  }, [socket, chatId]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e) => {
    setMessage(e.target.value);
    handleTyping();
  };

  const removeAttachment = (index) => {
    setAttachments(prev => {
      const n = [...prev];
      if (n[index].preview) URL.revokeObjectURL(n[index].preview);
      n.splice(index, 1);
      return n;
    });
  };

  const handleVoiceSend = (url, duration) => {
    onSendMessage('', 'voice', [{ url, duration }], replyTo?._id);
    setShowVoiceRecorder(false);
    setInputMode('mic');
  };

  const handleVideoSend = (url, duration) => {
    onSendMessage('', 'video_message', [{ url, duration }], replyTo?._id);
    setShowVideoRecorder(false);
    setInputMode('mic');
  };

  const attachMenuItems = [
    { icon: FiImage, label: 'Фото/видео', action: () => fileInputRef.current?.click() },
    { icon: FiFile, label: 'Файл', action: () => fileInputRef.current?.click() },
    { icon: FiMapPin, label: 'Карта', action: () => {} },
    { icon: FiMusic, label: 'Музыка', action: () => {} },
    ...(isGroup ? [{ icon: FiBarChart2, label: 'Опрос', action: () => {} }] : [])
  ];

  return (
    <div className="message-input-wrapper" {...getRootProps()}>
      <input {...getInputProps()} ref={fileInputRef} style={{ display: 'none' }} />
      
      <AnimatePresence>
        {showVoiceRecorder && (
          <VoiceRecorder onSend={handleVoiceSend} onCancel={() => { setShowVoiceRecorder(false); setInputMode('mic'); }} />
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {showVideoRecorder && (
          <VideoRecorder onSend={handleVideoSend} onCancel={() => { setShowVideoRecorder(false); setInputMode('mic'); }} />
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {attachments.length > 0 && (
          <motion.div 
            className="attachments-preview" 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: 'auto', opacity: 1 }} 
            exit={{ height: 0, opacity: 0 }}
          >
            <div className="attachments-header">
              <span>Прикреплено: {attachments.length}</span>
              <button onClick={() => { 
                attachments.forEach(a => a.preview && URL.revokeObjectURL(a.preview)); 
                setAttachments([]); 
              }}>
                <FiX /> Очистить
              </button>
            </div>
            <div className="attachments-grid">
              {attachments.map((att, i) => (
                <div key={i} className="attachment-item">
                  {att.type === 'image' ? <img src={att.preview} alt="" /> : 
                   att.type === 'video' ? <video src={att.preview} /> : (
                    <div className="file-preview"><FiFile size={32} /><span>{att.name}</span></div>
                  )}
                  <button className="remove-attachment" onClick={() => removeAttachment(i)}><FiX /></button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!showVoiceRecorder && !showVideoRecorder && (
        <div className="message-input-container">
          <motion.div className="message-input-bubble" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <button className="emoji-btn" onClick={() => setShowEmoji(!showEmoji)}><FiSmile /></button>
            
            <textarea
              ref={textareaRef}
              className="message-field"
              placeholder={replyTo ? `Ответить ${replyTo.sender?.username}` : "Сообщение"}
              value={message}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={uploading}
            />
            
            <div className="attach-wrapper">
              <button className="attach-btn" onClick={() => setShowAttachMenu(!showAttachMenu)}><FiPlus /></button>
              
              <AnimatePresence>
                {showAttachMenu && (
                  <motion.div 
                    className="attach-menu" 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: 10 }}
                  >
                    {attachMenuItems.map((item, i) => (
                      <button key={i} className="attach-menu-item" onClick={() => { item.action(); setShowAttachMenu(false); }}>
                        <item.icon /> {item.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          <div className="action-button-wrapper">
            {message.trim() || attachments.length > 0 ? (
              <button className="send-btn" onClick={handleSend} disabled={uploading}>
                {uploading ? <div className="spinner-small" /> : <FiSend />}
              </button>
            ) : (
              <button 
                className={`action-btn ${inputMode}`}
                onMouseDown={inputMode === 'mic' ? 
                  () => { pressTimerRef.current = setTimeout(() => setShowVoiceRecorder(true), 300); } : 
                  () => { pressTimerRef.current = setTimeout(() => setShowVideoRecorder(true), 300); }
                }
                onMouseUp={() => clearTimeout(pressTimerRef.current)}
                onMouseLeave={() => clearTimeout(pressTimerRef.current)}
                onClick={inputMode === 'mic' ? () => setInputMode('camera') : () => setInputMode('mic')}
              >
                {inputMode === 'mic' ? <FiMic /> : <FiCamera />}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(MessageInput);