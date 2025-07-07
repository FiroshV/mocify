import { useState, useEffect } from 'react';
import { tauri } from '../utils/tauri';

export const useServers = () => {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadServers = async () => {
    try {
      setLoading(true);
      const data = await tauri.invoke("get_running_servers");
      setServers(data);
      setError(null);
    } catch (err) {
      console.error("Failed to load servers:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startServer = async (collectionId) => {
    try {
      await tauri.invoke("start_server", { collectionId: collectionId });
      await loadServers();
    } catch (err) {
      console.error("Failed to start server:", err);
      throw err;
    }
  };

  const stopServer = async (port) => {
    try {
      await tauri.invoke("stop_server", { port });
      await loadServers();
    } catch (err) {
      console.error("Failed to stop server:", err);
      throw err;
    }
  };

  useEffect(() => {
    loadServers();
  }, []);

  return {
    servers,
    loading,
    error,
    loadServers,
    startServer,
    stopServer
  };
};