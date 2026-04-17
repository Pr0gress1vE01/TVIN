import React, { useEffect, useRef, useState } from 'react';
import { FiPlay, FiPause } from 'react-icons/fi';
import './VoiceMessagePlayer.scss';

// Простой плеер без WaveSurfer для избежания ошибок
const VoiceMessagePlayer = ({ audioUrl, duration, isOwn }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const progressRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoaded = () => {
      setIsLoaded(true);
      setError(false);
    };

    const handleError = () => {
      setError(true);
      setIsLoaded(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (progressRef.current) {
        const percent = (audio.currentTime / (audio.duration || duration)) * 100;
        progressRef.current.style.width = `${percent}%`;
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      if (progressRef.current) {
        progressRef.current.style.width = '0%';
      }
    };

    audio.addEventListener('loadeddata', handleLoaded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadeddata', handleLoaded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [duration]);

  const togglePlay = (e) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio || error) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch(err => {
        console.warn('Play error:', err);
      });
      setIsPlaying(true);
    }
  };

  const handleWaveformClick = (e) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio || error) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    audio.currentTime = percent * (audio.duration || duration);
  };

  const formatTime = (s) => {
    if (!s || isNaN(s) || s < 0) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const displayDuration = duration || (audioRef.current?.duration || 0);

  if (error) {
    return (
      <div className={`voice-message ${isOwn ? 'own' : ''} error`}>
        <button className="voice-play-btn" disabled>
          <FiPlay />
        </button>
        <div className="voice-waveform-wrapper error-message">
          <span>Не удалось загрузить</span>
        </div>
        <span className="voice-time">{formatTime(duration)}</span>
      </div>
    );
  }

  return (
    <div className={`voice-message ${isOwn ? 'own' : ''}`} onClick={e => e.stopPropagation()}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      <button className="voice-play-btn" onClick={togglePlay}>
        {isPlaying ? <FiPause /> : <FiPlay />}
      </button>
      
      <div className="voice-waveform-wrapper" onClick={handleWaveformClick}>
        <div className="voice-waveform-bg">
          <div className="voice-waveform-progress" ref={progressRef} />
        </div>
        <div className="voice-waveform-bars">
          {[...Array(25)].map((_, i) => (
            <div 
              key={i} 
              className="wave-bar"
              style={{ 
                height: `${15 + Math.sin(i * 0.5) * 10 + Math.random() * 10}px`,
                animationDelay: `${i * 0.05}s`
              }}
            />
          ))}
        </div>
      </div>
      
      <span className="voice-time">
        {isPlaying ? formatTime(currentTime) : formatTime(displayDuration)}
      </span>
    </div>
  );
};

export default React.memo(VoiceMessagePlayer);