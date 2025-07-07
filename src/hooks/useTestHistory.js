import { useState, useEffect } from 'react';

export const useTestHistory = () => {
  const [testHistory, setTestHistory] = useState([]);
  const [currentTestResults, setCurrentTestResults] = useState([]);

  const loadTestHistory = () => {
    try {
      const savedHistory = localStorage.getItem('mocify_test_history');
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);
        setTestHistory(parsedHistory);
      }
    } catch (error) {
      console.error("Failed to load test history:", error);
    }
  };

  const saveTestResult = (testResult) => {
    try {
      const currentHistory = JSON.parse(localStorage.getItem('mocify_test_history') || '[]');
      const updatedHistory = [testResult, ...currentHistory].slice(0, 100); // Keep last 100 results
      localStorage.setItem('mocify_test_history', JSON.stringify(updatedHistory));
      setTestHistory(updatedHistory);
      setCurrentTestResults(prev => [testResult, ...prev]);
    } catch (error) {
      console.error("Failed to save test result:", error);
    }
  };

  const clearTestHistory = () => {
    if (window.confirm("Are you sure you want to clear all test history?")) {
      localStorage.removeItem('mocify_test_history');
      setTestHistory([]);
    }
  };

  useEffect(() => {
    loadTestHistory();
  }, []);

  return {
    testHistory,
    currentTestResults,
    setCurrentTestResults,
    saveTestResult,
    clearTestHistory,
    loadTestHistory
  };
};