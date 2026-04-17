import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiRotateCw, FiX, FiSend } from 'react-icons/fi';
import axios from 'axios';
import './VideoRecorder.scss';

const VideoRecorder = ({ onSend, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [videoBlob, setVideoBlob] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [facingMode, setFacingMode] = useState('user');
  
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [facingMode]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 720 }, height: { ideal: 720 } },
        audio: true
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (error) {
      console.error('Camera error:', error);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp8') 
        ? 'video/webm;codecs=vp8' : 'video/webm'
    });
    mediaRecorderRef.current = mediaRecorder;
    
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      setVideoBlob(blob);
      setVideoUrl(URL.createObjectURL(blob));
      stopCamera();
    };
    
    mediaRecorder.start();
    setIsRecording(true);
    
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const handleSend = async () => {
    if (!videoBlob) return;
    try {
      const formData = new FormData();
      formData.append('video', videoBlob, 'video.webm');
      formData.append('duration', recordingTime);
      const res = await axios.post('/api/upload/video-message', formData);
      onSend(res.data.url, recordingTime);
    } catch (error) {
      console.error('Send error:', error);
    }
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div 
      className="video-recorder-fullscreen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="camera-circle">
        <video ref={videoRef} autoPlay playsInline muted className="camera-preview" />
        
        {isRecording && (
          <div className="recording-timer">
            <span className="red-dot" /> {formatTime(recordingTime)}
          </div>
        )}
      </div>

      {!videoUrl ? (
        <div className="camera-controls">
          <button className="flip-btn" onClick={() => setFacingMode(f => f === 'user' ? 'environment' : 'user')}>
            <FiRotateCw />
          </button>
          
          {!isRecording ? (
            <button className="record-circle-btn" onClick={startRecording}>
              <div className="record-icon" />
            </button>
          ) : (
            <button className="stop-circle-btn" onClick={stopRecording}>
              <div className="stop-icon" />
            </button>
          )}
          
          <button className="close-btn" onClick={onCancel}>
            <FiX />
          </button>
        </div>
      ) : (
        <div className="preview-controls">
          <video src={videoUrl} className="preview-video" autoPlay loop muted />
          <div className="preview-actions">
            <button className="retake-btn" onClick={() => {
              setVideoBlob(null);
              setVideoUrl(null);
              setRecordingTime(0);
              startCamera();
            }}>
              <FiRotateCw />
            </button>
            <button className="send-video-btn" onClick={handleSend}>
              <FiSend />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default VideoRecorder;