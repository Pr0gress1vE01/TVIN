import React, { useState, useRef, useEffect } from 'react';
import { FiVolume2, FiVolumeX } from 'react-icons/fi';
import './VideoMessagePlayer.scss';

const VideoMessagePlayer = ({ videoUrl, isOwn, duration }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(duration || 0);
  const [error, setError] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  const size = 200;
  const radius = size / 2 - 4;
  const circumference = 2 * Math.PI * radius;

  // Автопроигрывание без звука при появлении
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const playVideo = async () => {
      try {
        video.muted = true;
        await video.play();
      } catch (err) {
        // Игнорируем ошибку автопроигрывания
      }
    };
    
    playVideo();

    const handleLoaded = () => {
      setVideoDuration(video.duration);
      setError(false);
    };

    const handleError = () => {
      setError(true);
    };

    video.addEventListener('loadedmetadata', handleLoaded);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoaded);
      video.removeEventListener('error', handleError);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [videoUrl]);

  // Отрисовка кругового прогресса
  useEffect(() => {
    if (!canvasRef.current || error) return;
    const ctx = canvasRef.current.getContext('2d');
    
    const drawProgress = () => {
      ctx.clearRect(0, 0, size, size);
      
      // Фоновый круг
      ctx.beginPath();
      ctx.arc(size/2, size/2, radius, 0, 2 * Math.PI);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 3;
      ctx.stroke();
      
      // Прогресс
      if (progress > 0) {
        const endAngle = (progress / 100) * 2 * Math.PI - Math.PI / 2;
        ctx.beginPath();
        ctx.arc(size/2, size/2, radius, -Math.PI / 2, endAngle);
        ctx.strokeStyle = isOwn ? '#ffffff' : '#8B5CF6';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.stroke();
      }
      
      if (isPlaying && videoRef.current && !videoRef.current.paused) {
        animationRef.current = requestAnimationFrame(drawProgress);
      }
    };
    
    drawProgress();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [progress, isPlaying, isOwn, radius, size, error]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration || videoDuration;
      setCurrentTime(current);
      setProgress((current / total) * 100);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(100);
  };

  const handleClick = (e) => {
    e.stopPropagation();
    if (!videoRef.current || error) return;
    
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.currentTime = 0;
      setProgress(0);
      videoRef.current.muted = false;
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
      setIsMuted(false);
    }
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    if (videoRef.current && !error) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const formatTime = (s) => {
    if (!s || isNaN(s) || s < 0) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div className={`tg-video-message ${isOwn ? 'own' : ''} error`}>
        <div className="video-error">Не удалось загрузить</div>
      </div>
    );
  }

  return (
    <div className={`tg-video-message ${isOwn ? 'own' : ''}`} onClick={handleClick}>
      <video
        ref={videoRef}
        src={videoUrl}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        playsInline
        loop={!isPlaying}
        muted={isMuted}
        preload="metadata"
      />
      
      <canvas 
        ref={canvasRef} 
        width={size} 
        height={size} 
        className="progress-canvas"
      />
      
      <div className="video-controls-mini" onClick={e => e.stopPropagation()}>
        <span className="video-current-time">{formatTime(currentTime)}</span>
        <button className="video-mute-btn" onClick={toggleMute}>
          {isMuted ? <FiVolumeX /> : <FiVolume2 />}
        </button>
      </div>
    </div>
  );
};

export default React.memo(VideoMessagePlayer);