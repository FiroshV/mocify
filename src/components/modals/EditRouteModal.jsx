import React, { useState, useEffect } from 'react';

const EditRouteModal = ({ show, route, onClose, onSave }) => {
  const [activeTab, setActiveTab] = useState("basic");
  const [name, setName] = useState(route?.name || "");
  const [method, setMethod] = useState(route?.method || "GET");
  const [path, setPath] = useState(route?.path || "");
  const [statusCode, setStatusCode] = useState(route?.status_code || 200);
  const [responseBody, setResponseBody] = useState(route?.response_body || "");
  const [responseHeaders, setResponseHeaders] = useState({});

  useEffect(() => {
    if (route) {
      setName(route.name || "");
      setMethod(route.method || "GET");
      setPath(route.path || "");
      setStatusCode(route.status_code || 200);
      setResponseBody(route.response_body || "");
      setResponseHeaders(route.response_headers || {});
      setActiveTab("basic");
    }
  }, [route]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ 
      id: route.id,
      name, 
      method, 
      path, 
      status_code: statusCode, 
      response_body: responseBody,
      response_headers: Object.keys(responseHeaders).length > 0 ? responseHeaders : null
    });
  };

  const addHeader = () => {
    const key = prompt("Header name:");
    if (key) {
      setResponseHeaders({...responseHeaders, [key]: ""});
    }
  };

  const updateHeader = (key, value) => {
    setResponseHeaders({...responseHeaders, [key]: value});
  };

  const removeHeader = (key) => {
    const newHeaders = {...responseHeaders};
    delete newHeaders[key];
    setResponseHeaders(newHeaders);
  };

  if (!show || !route) return null;

  const tabs = [
    { id: "basic", label: "Basic", icon: "fas fa-info-circle" },
    { id: "headers", label: "Headers", icon: "fas fa-file-code" }
  ];

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-gray-800 p-6 rounded-lg w-[600px] max-h-[80vh] overflow-y-auto'>
        <h3 className='text-lg font-semibold mb-4'>Edit Route</h3>
        
        {/* Tab navigation */}
        <div className='flex border-b border-gray-600 mb-4'>
          {tabs.map(tab => (
            <button
              key={tab.id}
              type='button'
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                activeTab === tab.id 
                  ? 'border-blue-500 text-blue-400' 
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              <i className={`${tab.icon} mr-2`} />
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {/* Basic Tab */}
          {activeTab === "basic" && (
            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-medium mb-2'>Name</label>
                <input
                  type='text'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className='w-full p-2 bg-gray-700 rounded'
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium mb-2'>Method</label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className='w-full p-2 bg-gray-700 rounded'
                >
                  <option value='GET'>GET</option>
                  <option value='POST'>POST</option>
                  <option value='PUT'>PUT</option>
                  <option value='DELETE'>DELETE</option>
                </select>
              </div>
              <div>
                <label className='block text-sm font-medium mb-2'>Path</label>
                <input
                  type='text'
                  value={path}
                  onChange={(e) => setPath(e.target.value)}
                  className='w-full p-2 bg-gray-700 rounded'
                  placeholder='/api/endpoint'
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium mb-2'>Status Code</label>
                <input
                  type='number'
                  value={statusCode}
                  onChange={(e) => setStatusCode(Number(e.target.value))}
                  className='w-full p-2 bg-gray-700 rounded'
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium mb-2'>Response Body</label>
                <textarea
                  value={responseBody}
                  onChange={(e) => setResponseBody(e.target.value)}
                  className='w-full p-2 bg-gray-700 rounded'
                  rows={6}
                  placeholder='{"message": "Hello World"}'
                />
              </div>
            </div>
          )}

          {/* Headers Tab */}
          {activeTab === "headers" && (
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <h4 className='text-md font-medium'>Response Headers</h4>
                <button
                  type='button'
                  onClick={addHeader}
                  className='bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm'
                >
                  Add Header
                </button>
              </div>
              <div className='space-y-2'>
                {Object.entries(responseHeaders).map(([key, value]) => (
                  <div key={key} className='grid grid-cols-3 gap-2 items-center'>
                    <div className='p-2 bg-gray-900 rounded text-sm font-mono'>{key}</div>
                    <input
                      type='text'
                      placeholder='Value'
                      value={value}
                      onChange={(e) => updateHeader(key, e.target.value)}
                      className='p-2 bg-gray-700 rounded text-sm'
                    />
                    <button
                      type='button'
                      onClick={() => removeHeader(key)}
                      className='text-red-400 hover:text-red-300 p-1'
                    >
                      <i className='fas fa-trash' />
                    </button>
                  </div>
                ))}
                {Object.keys(responseHeaders).length === 0 && (
                  <p className='text-gray-500 text-sm text-center py-4'>
                    No headers defined. Click "Add Header" to add response headers.
                  </p>
                )}
              </div>
            </div>
          )}

          <div className='flex justify-end space-x-2 mt-6 pt-4 border-t border-gray-600'>
            <button
              type='button'
              onClick={onClose}
              className='px-4 py-2 bg-gray-600 rounded hover:bg-gray-500'
            >
              Cancel
            </button>
            <button
              type='submit'
              className='px-4 py-2 bg-blue-600 rounded hover:bg-blue-500'
            >
              Update Route
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditRouteModal;