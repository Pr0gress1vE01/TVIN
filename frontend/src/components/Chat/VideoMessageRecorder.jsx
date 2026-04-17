import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiVideo, FiSend, FiX, FiRotateCw } from 'react-icons/fi';
import axios from 'axios';
import './VideoMessageRecorder.scss';

const VideoMessageRecorder = ({ onSend, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [videoBlob, setVideoBlob] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [isSending, setIsSending] = useState(false);
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
        video: { 
          facingMode,
          width: { ideal: 480 },
          height: { ideal: 480 }
        },
        audio: true
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error('Camera error:', error);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    
    chunksRef.current = [];
    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp8') 
        ? 'video/webm;codecs=vp8' 
        : 'video/webm'
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
      setRecordingTime(prev => {
        if (prev >= 60) {
          stopRecording();
          return prev;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const handleSend = async () => {
    if (!videoBlob) return;
    
    setIsSending(true);
    try {
      const formData = new FormData();
      formData.append('video', videoBlob, 'video-message.webm');
      formData.append('duration', recordingTime);
      
      const response = await axios.post('/api/upload/video-message', formData);
      onSend(response.data.url, 'video_message', { duration: recordingTime });
      onCancel();
    } catch (error) {
      console.error('Send error:', error);
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (s) => `${s}с`;

  return (
    <motion.div 
      className="video-recorder"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <div className="camera-container">
        <video ref={videoRef} autoPlay playsInline muted className="preview" />
        
        {isRecording && (
          <div className="recording-badge">
            <span className="pulse" /> {formatTime(recordingTime)}
          </div>
        )}
      </div>

      {!videoUrl ? (
        <div className="controls">
          <button className="flip-btn" onClick={() => setFacingMode(f => f === 'user' ? 'environment' : 'user')}>
            <FiRotateCw />
          </button>
          
          {isRecording ? (
            <button className="stop-btn" onClick={stopRecording}>
              <div className="stop-icon" />
            </button>
          ) : (
            <button className="record-btn" onClick={startRecording}>
              <FiVideo />
            </button>
          )}
          
          <button className="cancel-btn" onClick={onCancel}>
            <FiX />
          </button>
        </div>
      ) : (
        <div className="preview-controls">
          <video src={videoUrl} className="preview-video" autoPlay loop muted />
          <div className="actions">
            <button className="retake-btn" onClick={() => {
              setVideoBlob(null);
              setVideoUrl(null);
              setRecordingTime(0);
              startCamera();
            }}>
              <FiRotateCw />
            </button>
            <button className="send-btn" onClick={handleSend} disabled={isSending}>
              {isSending ? '...' : <FiSend />}
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default VideoMessageRecorder;