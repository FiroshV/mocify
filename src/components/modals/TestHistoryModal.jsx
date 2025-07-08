import React, { useState } from 'react';

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

const TestHistoryModal = ({ show, testHistory, onClose, onClear }) => {
  const [filterText, setFilterText] = useState("");
  const [expandedHistory, setExpandedHistory] = useState({});

  if (!show) return null;

  const filteredHistory = testHistory.filter(result => 
    result.routeName.toLowerCase().includes(filterText.toLowerCase()) ||
    result.method.toLowerCase().includes(filterText.toLowerCase()) ||
    result.path.toLowerCase().includes(filterText.toLowerCase())
  );

  const groupedByDate = filteredHistory.reduce((acc, result) => {
    const date = new Date(result.timestamp).toLocaleDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(result);
    return acc;
  }, {});

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-gray-800 p-6 rounded-lg w-[800px] h-[80vh] flex flex-col'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-lg font-semibold'>Test History</h3>
          <div className='flex items-center space-x-2'>
            <button
              onClick={onClear}
              className='bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm'
            >
              Clear History
            </button>
            <button
              onClick={onClose}
              className='bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm'
            >
              Close
            </button>
          </div>
        </div>
        
        <div className='mb-4'>
          <input
            type='text'
            placeholder='Filter by route name, method, or path...'
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className='w-full p-2 rounded border border-gray-500' style={{backgroundColor: '#0d0d0d', color: '#e2e2e2'}}
          />
        </div>

        <div className='flex-1 overflow-y-auto'>
          {Object.keys(groupedByDate).length > 0 ? 
            Object.entries(groupedByDate).map(([date, results]) => (
              <div key={date} className='mb-4'>
                <h4 className='text-sm font-semibold text-gray-400 mb-2 border-b border-gray-600 pb-1'>{date}</h4>
                <div className='space-y-2'>
                  {results.map(result => (
                    <div
                      key={result.id}
                      className={`bg-gray-700 rounded p-3 ${result.success ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-red-500'}`}
                    >
                      <div 
                        className='cursor-pointer'
                        onClick={() => setExpandedHistory(prev => ({
                          ...prev,
                          [result.id]: !prev[result.id]
                        }))}
                      >
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center space-x-3'>
                            <span className={`inline-block w-2 h-2 rounded-full ${result.success ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span className='text-sm font-medium'>{result.routeName}</span>
                            <span className={`text-xs font-bold ${
                              result.method === 'GET' ? 'text-green-400' :
                              result.method === 'POST' ? 'text-blue-400' :
                              result.method === 'PUT' ? 'text-yellow-400' :
                              result.method === 'DELETE' ? 'text-red-400' : 'text-gray-400'
                            }`}>
                              {result.method}
                            </span>
                            <span className='text-xs text-gray-400'>{result.path}</span>
                          </div>
                          <div className='flex items-center space-x-3'>
                            <span className='text-xs text-gray-500'>
                              {new Date(result.timestamp).toLocaleTimeString()}
                            </span>
                            {result.success && (
                              <span className={`text-xs font-bold ${
                                result.status_code >= 200 && result.status_code < 300 ? 'text-green-400' :
                                result.status_code >= 400 ? 'text-red-400' : 'text-yellow-400'
                              }`}>
                                {result.status_code}
                              </span>
                            )}
                            {result.success && (
                              <span className='text-xs text-gray-400'>
                                {result.response_time_ms}ms
                              </span>
                            )}
                            <i className={`fas fa-chevron-${expandedHistory[result.id] ? 'down' : 'right'} text-xs text-gray-500`} />
                          </div>
                        </div>
                        {result.error && <div className='text-xs text-red-400 mt-1'>{result.error}</div>}
                      </div>
                      {expandedHistory[result.id] && result.success && (
                        <div className='mt-3 pt-3 border-t border-gray-600'>
                          <div className='grid grid-cols-1 gap-2 text-xs'>
                            <div>
                              <span className='text-gray-400'>URL: </span>
                              <span className='font-mono text-blue-300'>{result.url}</span>
                            </div>
                            {result.response_headers && (
                              <div>
                                <span className='text-gray-400'>Headers: </span>
                                <pre className='text-xs mt-1 bg-gray-800 p-2 rounded'>
                                  {JSON.stringify(result.response_headers, null, 2)}
                                </pre>
                              </div>
                            )}
                            {result.response_body && (
                              <div>
                                <span className='text-gray-400'>Response: </span>
                                <pre className='text-xs mt-1 bg-gray-800 p-2 rounded max-h-32 overflow-y-auto'>
                                  {formatJSON(result.response_body)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )) : 
            (
              <div className='text-center text-gray-500 py-8'>
                <i className='fas fa-history text-4xl mb-2' />
                <p>No test history found</p>
              </div>
            )
          }
        </div>
      </div>
    </div>
  );
};

export default TestHistoryModal;