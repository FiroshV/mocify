import { useState, useEffect } from 'react';
import { tauri } from '../utils/tauri';

export const useCollections = () => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadCollections = async () => {
    try {
      setLoading(true);
      const data = await tauri.invoke("get_collections");
      setCollections([...data]);
      setError(null);
    } catch (err) {
      console.error("Failed to load collections:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createCollection = async (collectionData) => {
    try {
      await tauri.invoke("create_collection", { request: collectionData });
      await loadCollections();
    } catch (err) {
      console.error("Failed to create collection:", err);
      throw err;
    }
  };

  const updateCollection = async (collectionData) => {
    try {
      await tauri.invoke("update_collection", { request: collectionData });
      await loadCollections();
    } catch (err) {
      console.error("Failed to update collection:", err);
      throw err;
    }
  };

  const deleteCollection = async (collectionId) => {
    try {
      await tauri.invoke("delete_collection", { id: collectionId });
      await loadCollections();
    } catch (err) {
      console.error("Failed to delete collection:", err);
      throw err;
    }
  };

  useEffect(() => {
    loadCollections();
  }, []);

  return {
    collections,
    loading,
    error,
    loadCollections,
    createCollection,
    updateCollection,
    deleteCollection
  };
};