import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiPlayCircle, FiPlusCircle, FiCheckCircle } from 'react-icons/fi';
import './ProfileMusic.scss';

const ProfileMusic = ({ userId }) => {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addedTracks, setAddedTracks] = useState(new Set());

  useEffect(() => {
    fetchMusic();
  }, [userId]);

  const fetchMusic = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/user/${userId}/music`);
      setTracks(response.data.tracks || []);
    } catch (error) {
      console.error('Error fetching music:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTrack = async (trackId) => {
    try {
      await axios.post(`/api/music/add`, { trackId });
      setAddedTracks(prev => new Set([...prev, trackId]));
    } catch (error) {
      console.error('Error adding track:', error);
    }
  };

  if (loading) {
    return (
      <div className="music-loading">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="skeleton-track" />
        ))}
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="empty-music">
        <p>Нет треков</p>
      </div>
    );
  }

  return (
    <div className="profile-music">
      <div className="music-header">
        <h3>Любимые треки</h3>
        <span className="track-count">{tracks.length}</span>
      </div>
      
      <div className="tracks-list">
        {tracks.map((track, index) => (
          <div key={track.id} className="track-item">
            <div className="track-info">
              <span className="track-index">{index + 1}</span>
              <div className="track-cover">
                {track.cover ? (
                  <img src={track.cover} alt="" />
                ) : (
                  <FiPlayCircle />
                )}
              </div>
              <div className="track-details">
                <span className="track-title">{track.title}</span>
                <span className="track-artist">{track.artist}</span>
              </div>
            </div>
            
            <div className="track-actions">
              <span className="track-duration">{track.duration}</span>
              <button 
                className="add-track-btn"
                onClick={() => handleAddTrack(track.id)}
                disabled={addedTracks.has(track.id)}
              >
                {addedTracks.has(track.id) ? (
                  <FiCheckCircle color="#2dd4bf" />
                ) : (
                  <FiPlusCircle />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfileMusic;