import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiSquare, FiSend, FiX } from 'react-icons/fi';
import axios from 'axios';
import './VoiceRecorder.scss';

const VoiceRecorder = ({ onSend, onCancel }) => {
  const [isRecording, setIsRecording] = useState(true);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isSending, setIsSending] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    startRecording();
    return () => cleanup();
  }, []);

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
          ? 'audio/webm;codecs=opus' : 'audio/webm'
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      
      mediaRecorder.start();
      startTimeRef.current = Date.now();
      
      timerRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
          setRecordingTime(elapsed);
        }
      }, 100);
    } catch (error) {
      console.error('Mic error:', error);
      onCancel();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const handleSend = async () => {
    if (!audioBlob) return;
    setIsSending(true);
    
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'voice.webm');
      formData.append('duration', recordingTime);
      
      const res = await axios.post('/api/upload/voice', formData);
      onSend(res.data.url, recordingTime);
    } catch (error) {
      console.error('Send error:', error);
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div 
      className="voice-recorder-fullwidth"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
    >
      <div className="recorder-content">
        {isRecording ? (
          <>
            <div className="recording-info">
              <span className="red-dot" />
              <span className="timer">{formatTime(recordingTime)}</span>
            </div>
            <button className="stop-btn" onClick={stopRecording}>
              <FiSquare />
            </button>
          </>
        ) : (
          <>
            <span className="duration-preview">{formatTime(recordingTime)}</span>
            <button className="send-voice-btn" onClick={handleSend} disabled={isSending}>
              {isSending ? '...' : <FiSend />}
            </button>
          </>
        )}
        <button className="cancel-voice-btn" onClick={onCancel}>
          <FiX />
        </button>
      </div>
    </motion.div>
  );
};

export default VoiceRecorder;