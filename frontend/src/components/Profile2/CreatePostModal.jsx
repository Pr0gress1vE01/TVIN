import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiImage, FiSmile, FiMapPin, FiSend, FiLoader } from 'react-icons/fi';
import { useDropzone } from 'react-dropzone';
import EmojiPicker from 'emoji-picker-react';
import axios from 'axios';
import './CreatePostModal.scss';

const CreatePostModal = ({ isOpen, onClose, onPostCreated }) => {
  const [content, setContent] = useState('');
  const [media, setMedia] = useState([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState('');
  const textareaRef = useRef(null);

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/*': [],
      'video/*': []
    },
    maxSize: 50 * 1024 * 1024,
    maxFiles: 10,
    onDrop: (acceptedFiles) => {
      const newMedia = acceptedFiles.map(file => ({
        file,
        preview: URL.createObjectURL(file),
        type: file.type.startsWith('image') ? 'image' : 'video'
      }));
      setMedia(prev => [...prev, ...newMedia].slice(0, 10));
    }
  });

  const handleSubmit = async () => {
    if (!content.trim() && media.length === 0) return;

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('content', content);
      if (location) formData.append('location', location);
      
      media.forEach(item => {
        formData.append('media', item.file);
      });

      const response = await axios.post('/api/post', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      onPostCreated(response.data);
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setContent('');
    media.forEach(item => URL.revokeObjectURL(item.preview));
    setMedia([]);
    setLocation('');
    setShowEmoji(false);
  };

  const removeMedia = (index) => {
    setMedia(prev => {
      const newMedia = [...prev];
      URL.revokeObjectURL(newMedia[index].preview);
      newMedia.splice(index, 1);
      return newMedia;
    });
  };

  const handleEmojiSelect = (emojiData) => {
    setContent(prev => prev + emojiData.emoji);
    textareaRef.current?.focus();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="create-post-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div 
          className="create-post-modal"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h2>Создать пост</h2>
            <button className="close-btn" onClick={onClose}>
              <FiX />
            </button>
          </div>

          <div className="modal-body">
            <div className="content-section">
              <textarea
                ref={textareaRef}
                placeholder="Что у вас нового?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
              />
            </div>

            {media.length > 0 && (
              <div className="media-section">
                <div className="media-grid">
                  {media.map((item, index) => (
                    <div key={index} className="media-item">
                      {item.type === 'image' ? (
                        <img src={item.preview} alt="" />
                      ) : (
                        <video src={item.preview} />
                      )}
                      <button 
                        className="remove-media"
                        onClick={() => removeMedia(index)}
                      >
                        <FiX />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="actions-section">
              <div className="action-buttons">
                <div {...getRootProps({ className: 'action-btn' })}>
                  <input {...getInputProps()} />
                  <FiImage />
                  <span>Фото/Видео</span>
                </div>

                <button 
                  className="action-btn"
                  onClick={() => setShowEmoji(!showEmoji)}
                >
                  <FiSmile />
                  <span>Эмодзи</span>
                </button>

                <button 
                  className="action-btn"
                  onClick={() => {
                    const loc = prompt('Введите местоположение:');
                    if (loc) setLocation(loc);
                  }}
                >
                  <FiMapPin />
                  <span>{location || 'Место'}</span>
                </button>
              </div>
            </div>

            {showEmoji && (
              <div className="emoji-picker-wrapper">
                <EmojiPicker onEmojiClick={handleEmojiSelect} theme="dark" />
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button className="btn-secondary" onClick={onClose}>
              Отмена
            </button>
            <button 
              className="btn-primary"
              onClick={handleSubmit}
              disabled={loading || (!content.trim() && media.length === 0)}
            >
              {loading ? <FiLoader className="spinning" /> : <FiSend />}
              <span>Опубликовать</span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CreatePostModal;