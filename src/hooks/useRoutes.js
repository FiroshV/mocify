import { useState, useEffect } from 'react';
import { tauri } from '../utils/tauri';

export const useRoutes = (selectedCollection) => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadRoutes = async (collectionId) => {
    if (!collectionId) {
      setRoutes([]);
      return;
    }
    
    try {
      setLoading(true);
      const data = await tauri.invoke("get_routes", { collectionId: collectionId });
      setRoutes(data);
      setError(null);
    } catch (err) {
      console.error("Failed to load routes:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createRoute = async (routeData) => {
    try {
      await tauri.invoke("create_route", { request: routeData });
      await loadRoutes(selectedCollection?.id);
    } catch (err) {
      console.error("Failed to create route:", err);
      throw err;
    }
  };

  const updateRoute = async (routeData) => {
    try {
      await tauri.invoke("update_route", { request: routeData });
      await loadRoutes(selectedCollection?.id);
    } catch (err) {
      console.error("Failed to update route:", err);
      throw err;
    }
  };

  const deleteRoute = async (routeId) => {
    try {
      await tauri.invoke("delete_route", { id: routeId });
      await loadRoutes(selectedCollection?.id);
    } catch (err) {
      console.error("Failed to delete route:", err);
      throw err;
    }
  };

  useEffect(() => {
    loadRoutes(selectedCollection?.id);
  }, [selectedCollection?.id]);

  return {
    routes,
    loading,
    error,
    loadRoutes,
    createRoute,
    updateRoute,
    deleteRoute
  };
};