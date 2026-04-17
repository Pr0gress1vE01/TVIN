import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { 
  FiImage, 
  FiSmile, 
  FiMapPin, 
  FiX,
  FiSend,
  FiLoader
} from 'react-icons/fi';
import EmojiPicker from 'emoji-picker-react';
import './CreatePost.scss';

const CreatePost = ({ onPostCreated }) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [media, setMedia] = useState([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState('');
  const [visibility, setVisibility] = useState('public');
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
      formData.append('visibility', visibility);
      if (location) formData.append('location', location);
      
      media.forEach(item => {
        formData.append('media', item.file);
      });

      const response = await axios.post('/api/post', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      onPostCreated(response.data);
      resetForm();
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setContent('');
    setMedia([]);
    setLocation('');
    setVisibility('public');
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

  return (
    <div className="create-post">
      <div className="create-post__header">
        <img src={user?.avatar || '/default-avatar.svg'} alt="" />
        <div className="create-post__input">
          <textarea
            ref={textareaRef}
            placeholder={`Что нового, ${user?.firstName}?`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={content ? 3 : 1}
          />
        </div>
      </div>

      <AnimatePresence>
        {media.length > 0 && (
          <motion.div 
            className="create-post__media"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
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
          </motion.div>
        )}
      </AnimatePresence>

      <div className="create-post__footer">
        <div className="create-post__actions">
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

        <button 
          className="submit-btn"
          onClick={handleSubmit}
          disabled={loading || (!content.trim() && media.length === 0)}
        >
          {loading ? <FiLoader className="spinning" /> : <FiSend />}
          <span>Опубликовать</span>
        </button>
      </div>

      <AnimatePresence>
        {showEmoji && (
          <motion.div 
            className="emoji-picker-wrapper"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <EmojiPicker
              onEmojiClick={handleEmojiSelect}
              theme="dark"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CreatePost;