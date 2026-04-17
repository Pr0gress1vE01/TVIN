import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiSmile } from 'react-icons/fi';
import axios from 'axios';
import './StickerPicker.scss';

const StickerPicker = ({ isOpen, onClose, onSelectSticker }) => {
  const [stickers, setStickers] = useState([]);
  const [activePack, setActivePack] = useState('default');
  const [loading, setLoading] = useState(false);

  const stickerPacks = {
    default: {
      name: 'Стандартные',
      stickers: [
        { id: '1', url: '/stickers/like.png', emoji: '👍' },
        { id: '2', url: '/stickers/heart.png', emoji: '❤️' },
        { id: '3', url: '/stickers/laugh.png', emoji: '😄' },
        { id: '4', url: '/stickers/sad.png', emoji: '😢' },
        { id: '5', url: '/stickers/angry.png', emoji: '😠' },
        { id: '6', url: '/stickers/surprise.png', emoji: '😮' },
        { id: '7', url: '/stickers/cool.png', emoji: '😎' },
        { id: '8', url: '/stickers/ok.png', emoji: '👌' },
      ]
    },
    cats: {
      name: 'Котики',
      stickers: [
        { id: 'c1', url: '/stickers/cat1.png', emoji: '🐱' },
        { id: 'c2', url: '/stickers/cat2.png', emoji: '😺' },
        { id: 'c3', url: '/stickers/cat3.png', emoji: '😸' },
        { id: 'c4', url: '/stickers/cat4.png', emoji: '😻' },
      ]
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadStickers();
    }
  }, [isOpen, activePack]);

  const loadStickers = async () => {
    setLoading(true);
    // Имитация загрузки
    setTimeout(() => {
      setStickers(stickerPacks[activePack]?.stickers || []);
      setLoading(false);
    }, 300);
  };

  const handleStickerClick = (sticker) => {
    onSelectSticker(sticker);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="sticker-picker"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
      >
        <div className="sticker-picker__header">
          <h3>Стикеры</h3>
          <button className="close-btn" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <div className="sticker-picker__tabs">
          {Object.entries(stickerPacks).map(([key, pack]) => (
            <button
              key={key}
              className={`tab ${activePack === key ? 'active' : ''}`}
              onClick={() => setActivePack(key)}
            >
              {pack.name}
            </button>
          ))}
        </div>

        <div className="sticker-picker__content">
          {loading ? (
            <div className="loading">
              <div className="spinner" />
            </div>
          ) : (
            <div className="stickers-grid">
              {stickers.map(sticker => (
                <motion.div
                  key={sticker.id}
                  className="sticker-item"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleStickerClick(sticker)}
                >
                  <img src={sticker.url} alt={sticker.emoji} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default StickerPicker;