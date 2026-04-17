import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const DiagnosticsContext = createContext();

export const useDiagnostics = () => {
  const context = useContext(DiagnosticsContext);
  if (!context) {
    throw new Error('useDiagnostics must be used within DiagnosticsProvider');
  }
  return context;
};

export const DiagnosticsProvider = ({ children }) => {
  const [diagnostics, setDiagnostics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDiagnostics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/api/diagnostics/health', {
        timeout: 5000
      });
      setDiagnostics(response.data);
    } catch (error) {
      console.error('Error fetching diagnostics:', error);
      setError(error.message);
      // Устанавливаем дефолтные значения при ошибке
      setDiagnostics({
        status: 'unknown',
        services: {
          database: 'unknown',
          websocket: 'unknown'
        }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagnostics();
    
    // Проверяем каждые 30 секунд
    const interval = setInterval(fetchDiagnostics, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const value = {
    diagnostics,
    loading,
    error,
    fetchDiagnostics
  };

  return (
    <DiagnosticsContext.Provider value={value}>
      {children}
    </DiagnosticsContext.Provider>
  );
};

export default DiagnosticsContext;