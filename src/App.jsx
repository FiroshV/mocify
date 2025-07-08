import React, { useState } from 'react';
import { useCollections } from './hooks/useCollections';
import { useRoutes } from './hooks/useRoutes';
import { useServers } from './hooks/useServers';
import { useTestHistory } from './hooks/useTestHistory';
import { tauri } from './utils/tauri';

// Modal components
import NewCollectionModal from './components/modals/NewCollectionModal';
import EditCollectionModal from './components/modals/EditCollectionModal';
import NewRouteModal from './components/modals/NewRouteModal';
import EditRouteModal from './components/modals/EditRouteModal';
import TestHistoryModal from './components/modals/TestHistoryModal';

// Utility function to format JSON
const formatJSON = (jsonString) => {
  if (!jsonString) return '';
  
  // If it's already an object, stringify it directly
  if (typeof jsonString === 'object') {
    return JSON.stringify(jsonString, null, 2);
  }
  
  try {
    // Clean the JSON string by replacing smart quotes and other problematic characters
    let cleanedJson = jsonString.toString().trim()
      .replace(/[\u201C\u201D]/g, '"')  // Replace smart double quotes
      .replace(/[\u2018\u2019]/g, "'")  // Replace smart single quotes
      .replace(/[\u2013\u2014]/g, '-')  // Replace em dashes
      .replace(/\u00A0/g, ' ');        // Replace non-breaking spaces
    
    const parsed = JSON.parse(cleanedJson);
    return JSON.stringify(parsed, null, 2);
  } catch (error) {
    // If not valid JSON, return as-is
    return jsonString.toString();
  }
};

function App() {
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [showNewCollection, setShowNewCollection] = useState(false);
  const [showNewRoute, setShowNewRoute] = useState(false);
  const [showTestHistory, setShowTestHistory] = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);
  const [showEditCollection, setShowEditCollection] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [showEditRoute, setShowEditRoute] = useState(false);
  const [expandedResults, setExpandedResults] = useState({});
  const [showTestResults, setShowTestResults] = useState(true);

  // Custom hooks
  const { collections, createCollection, updateCollection, deleteCollection } = useCollections();
  const { routes, createRoute, updateRoute, deleteRoute } = useRoutes(selectedCollection);
  const { servers, startServer, stopServer } = useServers();
  const { testHistory, currentTestResults, setCurrentTestResults, saveTestResult, clearTestHistory } = useTestHistory();

  const testRoute = async (routeId) => {
    console.log("Starting test for route:", routeId);
    
    try {
      const result = await tauri.invoke("test_route", {
        request: { route_id: routeId }
      });
      
      const testResult = {
        id: Date.now(),
        routeId: routeId,
        routeName: selectedRoute?.name || 'Unknown Route',
        method: result.method || selectedRoute?.method || 'GET',
        path: selectedRoute?.path || '/',
        url: result.url,
        timestamp: new Date().toISOString(),
        success: true,
        status_code: result.status_code,
        response_time_ms: result.response_time_ms,
        response_body: result.body,
        response_headers: result.headers,
        error: null
      };
      
      saveTestResult(testResult);
      console.log("Test successful! Status:", result.status_code, "Response Time:", result.response_time_ms + "ms");
    } catch (error) {
      console.error("Test route failed with error:", error);
      const testResult = {
        id: Date.now(),
        routeId: routeId,
        routeName: selectedRoute?.name || 'Unknown Route',
        method: selectedRoute?.method || 'GET',
        path: selectedRoute?.path || '/',
        timestamp: new Date().toISOString(),
        success: false,
        status_code: null,
        response_time_ms: null,
        response_body: null,
        response_headers: null,
        error: error.message || 'Test failed'
      };
      
      saveTestResult(testResult);
    }
  };

  const handleCreateRoute = async (routeData) => {
    await createRoute({
      ...routeData,
      collection_id: selectedCollection.id
    });
  };

  const handleUpdateCollection = async (collectionData) => {
    await updateCollection(collectionData);
    setEditingCollection(null);
    setShowEditCollection(false);
  };

  const handleUpdateRoute = async (routeData) => {
    await updateRoute(routeData);
    setEditingRoute(null);
    setShowEditRoute(false);
  };

  const handleDeleteCollection = async (collectionId) => {
    if (window.confirm("Are you sure you want to delete this collection? This will also delete all its routes.")) {
      await deleteCollection(collectionId);
      if (selectedCollection?.id === collectionId) {
        setSelectedCollection(null);
      }
    }
  };

  const handleDeleteRoute = async (routeId) => {
    if (window.confirm("Are you sure you want to delete this route?")) {
      await deleteRoute(routeId);
      if (selectedRoute?.id === routeId) {
        setSelectedRoute(null);
      }
    }
  };

  return (
    <div className='flex h-screen bg-black text-gray-100'>
      {/* Sidebar */}
      <div className='w-80 bg-black border-r border-gray-600 overflow-y-auto'>
        <div className='p-4'>
          <h1 className='text-2xl font-bold mb-6 text-blue-400'>
            <i className='fas fa-server mr-2' />
            Mocify
          </h1>
          <div className='mb-4'>
            <button
              onClick={() => setShowNewCollection(true)}
              className='w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition'
            >
              <i className='fas fa-plus mr-2' />
              New Collection
            </button>
          </div>
          <h2 className='text-sm font-semibold text-gray-400 uppercase mb-2'>
            Collections
          </h2>
          {collections.map(collection => {
            const server = servers.find(s => s.collection_id === collection.id);
            return (
              <div
                key={collection.id}
                className={`py-2 px-3 rounded mb-2 transition ${
                  selectedCollection?.id === collection.id ? 'bg-gray-800' : 'hover:bg-gray-800'
                }`}
              >
                <div 
                  className='flex items-center justify-between cursor-pointer'
                  onClick={() => setSelectedCollection(collection)}
                >
                  <div className='flex items-center min-w-0 flex-1'>
                    <i className='fas fa-folder mr-2 text-yellow-500 flex-shrink-0' />
                    <span className='truncate'>{collection.name}</span>
                  </div>
                  <div className='flex items-center space-x-2 flex-shrink-0 ml-2'>
                    <span className='text-xs text-gray-400'>:{collection.port}</span>
                    {server?.is_running && <span className='w-2 h-2 bg-green-500 rounded-full' />}
                    <div className='flex items-center space-x-1 opacity-80 hover:opacity-100 transition-opacity'>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingCollection(collection);
                          setShowEditCollection(true);
                        }}
                        className='text-blue-400 hover:text-blue-300 text-xs p-1'
                        title='Edit Collection'
                      >
                        <i className='fas fa-edit' />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCollection(collection.id);
                        }}
                        className='text-red-400 hover:text-red-300 text-xs p-1'
                        title='Delete Collection'
                      >
                        <i className='fas fa-trash' />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Main Content */}
      <div className='flex-1 flex'>
        {/* Routes List */}
        <div className='w-96 bg-black border-r border-gray-600 overflow-y-auto'>
          {selectedCollection ? (
            <div className='p-4'>
              <div className='flex items-center justify-between mb-4'>
                <h2 className='text-lg font-semibold'>{selectedCollection.name}</h2>
                <div className='flex space-x-2'>
                  {servers.find(s => s.collection_id === selectedCollection.id)?.is_running ? (
                    <button
                      onClick={() => stopServer(selectedCollection.port)}
                      className='bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition'
                    >
                      <i className='fas fa-stop mr-1' />
                      Stop
                    </button>
                  ) : (
                    <button
                      onClick={() => startServer(selectedCollection.id)}
                      className='bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition'
                    >
                      <i className='fas fa-play mr-1' />
                      Start
                    </button>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowNewRoute(true)}
                className='w-full bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded mb-4 transition'
              >
                <i className='fas fa-plus mr-2' />
                New Route
              </button>
              {routes.map(route => (
                <div
                  key={route.id}
                  className={`py-2 px-3 rounded mb-2 transition ${
                    selectedRoute?.id === route.id ? 'bg-gray-800' : 'hover:bg-gray-800'
                  }`}
                >
                  <div 
                    className='cursor-pointer'
                    onClick={() => setSelectedRoute(route)}
                  >
                    <div className='flex items-center justify-between'>
                      <div className='min-w-0 flex-1'>
                        <div className='flex items-center'>
                          <span className={`inline-block w-12 text-xs font-bold mr-2 flex-shrink-0 ${
                            route.method === 'GET' ? 'text-green-400' :
                            route.method === 'POST' ? 'text-blue-400' :
                            route.method === 'PUT' ? 'text-yellow-400' :
                            route.method === 'DELETE' ? 'text-red-400' : 'text-gray-400'
                          }`}>
                            {route.method}
                          </span>
                          <span className='text-sm truncate'>{route.path}</span>
                        </div>
                        {route.name && <div className='text-xs text-gray-500 mt-1 truncate'>{route.name}</div>}
                      </div>
                      <div className='flex items-center space-x-2 flex-shrink-0 ml-2'>
                        <span className='text-xs text-gray-400'>{route.status_code}</span>
                        <div className='flex items-center space-x-1 opacity-80 hover:opacity-100 transition-opacity'>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingRoute(route);
                              setShowEditRoute(true);
                            }}
                            className='text-blue-400 hover:text-blue-300 text-xs p-1'
                            title='Edit Route'
                          >
                            <i className='fas fa-edit' />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteRoute(route.id);
                            }}
                            className='text-red-400 hover:text-red-300 text-xs p-1'
                            title='Delete Route'
                          >
                            <i className='fas fa-trash' />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='flex items-center justify-center h-full text-gray-400'>
              <div className='text-center'>
                <i className='fas fa-folder-open text-4xl mb-2 text-gray-500' />
                <p>Select a collection</p>
              </div>
            </div>
          )}
        </div>

        {/* Route Details */}
        <div className='flex-1 bg-black overflow-y-auto'>
          {selectedRoute ? (
            <div className='p-6'>
              <div className='flex items-center justify-between mb-6'>
                <h3 className='text-xl font-semibold'>{selectedRoute.name}</h3>
                <div className='flex items-center space-x-3'>
                  <button
                    onClick={() => setShowTestHistory(true)}
                    className='text-blue-400 hover:text-blue-300 text-sm px-3 py-2 rounded border border-blue-400 hover:border-blue-300 transition'
                    title='View Test History'
                  >
                    <i className='fas fa-history mr-1' />
                    History
                  </button>
                  <button
                    onClick={() => testRoute(selectedRoute.id)}
                    className='bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded transition'
                  >
                    <i className='fas fa-play mr-2' />
                    Test Route
                  </button>
                </div>
              </div>
              
              {/* Test Results - Moved to top for better visibility */}
              {currentTestResults.filter(result => result.routeId === selectedRoute.id).length > 0 && (
                <div className='mb-6'>
                  <div 
                    className='flex items-center cursor-pointer mb-3'
                    onClick={() => setShowTestResults(!showTestResults)}
                  >
                    <label className='text-sm font-medium text-gray-400'>Latest Test Results</label>
                    <i className={`fas fa-chevron-${showTestResults ? 'down' : 'right'} text-xs text-gray-400 ml-2`} />
                    <span className='ml-2 text-xs text-gray-500'>({currentTestResults.filter(result => result.routeId === selectedRoute.id).length})</span>
                  </div>
                  {showTestResults && (
                    <div className='bg-black rounded border border-gray-600 max-h-60 overflow-y-auto'>
                      {currentTestResults.filter(result => result.routeId === selectedRoute.id).slice(0, 5).map(result => (
                        <div
                          key={result.id}
                          className={`border-b border-gray-600 last:border-b-0 ${result.success ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-red-500'}`}
                        >
                          <div 
                            className='p-3 cursor-pointer hover:bg-gray-800 transition'
                            onClick={() => setExpandedResults(prev => ({
                              ...prev,
                              [result.id]: !prev[result.id]
                            }))}
                          >
                            <div className='flex items-center justify-between'>
                              <div className='flex items-center space-x-2'>
                                <span className={`inline-block w-2 h-2 rounded-full ${result.success ? 'bg-green-500' : 'bg-red-500'}`} />
                                <span className='text-xs text-gray-400'>
                                  {new Date(result.timestamp).toLocaleTimeString()}
                                </span>
                                <span className={`text-xs font-medium ${
                                  result.success ? 'text-green-400' : 'text-red-400'
                                }`}>
                                  {result.success ? 'Success' : 'Failed'}
                                </span>
                                <i className={`fas fa-chevron-${expandedResults[result.id] ? 'down' : 'right'} text-xs text-gray-500 ml-1`} />
                              </div>
                              <div className='flex items-center space-x-3'>
                                {result.status_code && (
                                  <span className={`text-xs font-bold px-2 py-1 rounded ${
                                    result.status_code >= 200 && result.status_code < 300 ? 'text-green-400 bg-green-900/20' :
                                    result.status_code >= 400 ? 'text-red-400 bg-red-900/20' : 'text-yellow-400 bg-yellow-900/20'
                                  }`}>
                                    {result.status_code}
                                  </span>
                                )}
                                {result.response_time_ms && (
                                  <span className='text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded'>
                                    {result.response_time_ms}ms
                                  </span>
                                )}
                              </div>
                            </div>
                            {result.error && <div className='text-xs text-red-400 mt-1'>{result.error}</div>}
                          </div>
                          {expandedResults[result.id] && (
                            <div className='px-3 pb-3 border-t border-gray-600 bg-gray-800'>
                              <div className='space-y-3 mt-3'>
                                <div>
                                  <div className='text-xs font-medium text-gray-400 mb-1'>Request</div>
                                  <div className='bg-gray-800 p-2 rounded text-xs font-mono'>
                                    <div>
                                      <span className={`font-bold ${
                                        result.method === 'GET' ? 'text-green-400' :
                                        result.method === 'POST' ? 'text-blue-400' :
                                        result.method === 'PUT' ? 'text-yellow-400' :
                                        result.method === 'DELETE' ? 'text-red-400' : 'text-gray-400'
                                      }`}>
                                        {result.method} 
                                      </span>
                                      <span className='text-blue-300'>{result.url || (result.path || '/')}</span>
                                    </div>
                                  </div>
                                </div>
                                {result.success && (
                                  <div>
                                    <div className='text-xs font-medium text-gray-400 mb-1'>Response Headers</div>
                                    <div className='bg-gray-800 p-2 rounded text-xs font-mono max-h-32 overflow-y-auto'>
                                      {result.response_headers ? Object.entries(result.response_headers).map(([key, value]) => (
                                        <div key={key}>
                                          <span className='text-blue-400'>{key}: </span>
                                          <span className='text-gray-300'>{value}</span>
                                        </div>
                                      )) : 'No headers'}
                                    </div>
                                  </div>
                                )}
                                {result.response_body && (
                                  <div>
                                    <div className='text-xs font-medium text-gray-400 mb-1'>Response Body</div>
                                    <pre className='bg-gray-800 p-2 rounded text-xs font-mono max-h-32 overflow-y-auto whitespace-pre-wrap'>{formatJSON(result.response_body)}</pre>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className='space-y-6'>
                <div>
                  <label className='block text-sm font-medium text-gray-400 mb-2'>Endpoint</label>
                  <div className='bg-black p-3 rounded font-mono text-sm'>
                    <span className={`font-bold mr-2 ${
                      selectedRoute.method === 'GET' ? 'text-green-400' :
                      selectedRoute.method === 'POST' ? 'text-blue-400' :
                      selectedRoute.method === 'PUT' ? 'text-yellow-400' :
                      selectedRoute.method === 'DELETE' ? 'text-red-400' : 'text-gray-400'
                    }`}>
                      {selectedRoute.method}
                    </span>
                    {selectedRoute.path}
                  </div>
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-400 mb-2'>Status Code</label>
                  <div className='bg-black p-3 rounded'>
                    <span className={`font-bold ${
                      selectedRoute.status_code >= 200 && selectedRoute.status_code < 300 ? 'text-green-400' :
                      selectedRoute.status_code >= 400 ? 'text-red-400' : 'text-yellow-400'
                    }`}>
                      {selectedRoute.status_code}
                    </span>
                  </div>
                </div>
                {selectedRoute.delay && selectedRoute.delay > 0 && (
                  <div>
                    <label className='block text-sm font-medium text-gray-400 mb-2'>Response Delay</label>
                    <div className='bg-black p-3 rounded'>
                      <span className='text-blue-400 font-bold'>{selectedRoute.delay}ms</span>
                      <span className='text-gray-500 text-sm ml-2'>
                        ({selectedRoute.delay / 1000}s)
                      </span>
                    </div>
                  </div>
                )}
                
                {selectedRoute.response_body && (
                  <div>
                    <label className='block text-sm font-medium text-gray-400 mb-2'>Response Body</label>
                    <pre className='bg-black p-3 rounded overflow-x-auto text-sm font-mono whitespace-pre-wrap'>{formatJSON(selectedRoute.response_body)}</pre>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className='flex items-center justify-center h-full text-gray-400'>
              <div className='text-center'>
                <i className='fas fa-route text-4xl mb-2 text-gray-500' />
                <p>Select a route</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <NewCollectionModal
        show={showNewCollection}
        onClose={() => setShowNewCollection(false)}
        onSave={createCollection}
      />

      <NewRouteModal
        show={showNewRoute}
        onClose={() => setShowNewRoute(false)}
        onSave={handleCreateRoute}
      />

      <EditCollectionModal
        show={showEditCollection}
        collection={editingCollection}
        onClose={() => {
          setShowEditCollection(false);
          setEditingCollection(null);
        }}
        onSave={handleUpdateCollection}
      />

      <EditRouteModal
        show={showEditRoute}
        route={editingRoute}
        onClose={() => {
          setShowEditRoute(false);
          setEditingRoute(null);
        }}
        onSave={handleUpdateRoute}
      />

      <TestHistoryModal
        show={showTestHistory}
        testHistory={testHistory}
        onClose={() => setShowTestHistory(false)}
        onClear={clearTestHistory}
      />
    </div>
  );
}

export default App;