import React, { useState, useEffect } from 'react';

const EditRouteModal = ({ show, route, onClose, onSave }) => {
  const [name, setName] = useState(route?.name || "");
  const [method, setMethod] = useState(route?.method || "GET");
  const [path, setPath] = useState(route?.path || "");
  const [statusCode, setStatusCode] = useState(route?.status_code || 200);
  const [responseBody, setResponseBody] = useState(route?.response_body || "");
  const [delay, setDelay] = useState(route?.delay_ms || 0);

  useEffect(() => {
    if (route) {
      console.log('EditRouteModal - route data:', route);
      console.log('EditRouteModal - route.response_body:', route.response_body);
      setName(route.name || "");
      setMethod(route.method || "GET");
      setPath(route.path || "");
      setStatusCode(route.status_code || 200);
      
      // Auto-format JSON in response body if it's valid JSON
      const responseBodyValue = route.response_body || "";
      if (responseBodyValue.trim()) {
        try {
          // Clean the JSON string by replacing smart quotes and other problematic characters
          let cleanedJson = responseBodyValue.trim()
            .replace(/[\u201C\u201D]/g, '"')  // Replace smart double quotes
            .replace(/[\u2018\u2019]/g, "'")  // Replace smart single quotes
            .replace(/[\u2013\u2014]/g, '-')  // Replace em dashes
            .replace(/\u00A0/g, ' ');        // Replace non-breaking spaces
          
          const parsed = JSON.parse(cleanedJson);
          const formatted = JSON.stringify(parsed, null, 2);
          setResponseBody(formatted);
          console.log('EditRouteModal - auto-formatted JSON:', formatted);
        } catch (error) {
          // If not valid JSON, use as-is
          setResponseBody(responseBodyValue);
          console.log('EditRouteModal - not valid JSON, using original:', responseBodyValue);
        }
      } else {
        setResponseBody(responseBodyValue);
      }
      
      setDelay(route.delay_ms || 0);
    }
  }, [route]);

  const handleBeautifyJson = () => {
    console.log('Edit Modal - Beautify button clicked!');
    console.log('Edit Modal - Current responseBody:', responseBody);
    console.log('Edit Modal - responseBody type:', typeof responseBody);
    console.log('Edit Modal - responseBody length:', responseBody.length);
    
    if (!responseBody || !responseBody.trim()) {
      alert('Please enter some JSON content first.');
      return;
    }
    
    try {
      // Clean the JSON string by replacing smart quotes and other problematic characters
      let cleanedJson = responseBody.trim()
        .replace(/[\u201C\u201D]/g, '"')  // Replace smart double quotes
        .replace(/[\u2018\u2019]/g, "'")  // Replace smart single quotes
        .replace(/[\u2013\u2014]/g, '-')  // Replace em dashes
        .replace(/\u00A0/g, ' ');        // Replace non-breaking spaces
      
      console.log('Edit Modal - Cleaned JSON:', cleanedJson);
      
      const parsed = JSON.parse(cleanedJson);
      const formatted = JSON.stringify(parsed, null, 2);
      console.log('Edit Modal - Successfully formatted JSON:', formatted);
      setResponseBody(formatted);
    } catch (error) {
      console.error('Edit Modal - JSON parsing error:', error);
      console.log('Edit Modal - Problematic JSON string:', JSON.stringify(responseBody));
      alert(`Invalid JSON format: ${error.message}\n\nTip: Make sure to use straight quotes (") not curly quotes (")`);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ 
      id: route.id,
      name, 
      method, 
      path, 
      status_code: statusCode, 
      response_body: responseBody,
      delay_ms: delay
    });
  };

  if (!show || !route) return null;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-gray-800 p-6 rounded-lg w-[600px] max-h-[90vh] overflow-y-auto'>
        <h3 className='text-lg font-semibold mb-4'>Edit Route</h3>

        <form onSubmit={handleSubmit}>
          <div className='grid grid-cols-2 gap-4 mb-4'>
            <div>
              <label className='block text-sm font-medium mb-1'>Name</label>
              <input
                type='text'
                value={name}
                onChange={(e) => setName(e.target.value)}
                className='w-full p-2 rounded border border-gray-500' style={{backgroundColor: '#0d0d0d', color: '#e2e2e2'}}
                required
              />
            </div>
            <div>
              <label className='block text-sm font-medium mb-1'>Method</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className='w-full p-2 rounded border border-gray-500' style={{backgroundColor: '#0d0d0d', color: '#e2e2e2'}}
              >
                <option value='GET'>GET</option>
                <option value='POST'>POST</option>
                <option value='PUT'>PUT</option>
                <option value='DELETE'>DELETE</option>
              </select>
            </div>
            <div>
              <label className='block text-sm font-medium mb-1'>Path</label>
              <input
                type='text'
                value={path}
                onChange={(e) => setPath(e.target.value)}
                className='w-full p-2 rounded border border-gray-500' style={{backgroundColor: '#0d0d0d', color: '#e2e2e2'}}
                placeholder='/api/endpoint'
                required
              />
            </div>
            <div>
              <label className='block text-sm font-medium mb-1'>Status Code</label>
              <input
                type='number'
                value={statusCode}
                onChange={(e) => setStatusCode(Number(e.target.value))}
                className='w-full p-2 rounded border border-gray-500' style={{backgroundColor: '#0d0d0d', color: '#e2e2e2'}}
                required
              />
            </div>
            <div className='col-span-2'>
              <label className='block text-sm font-medium mb-1'>
                Response Delay (ms)
                <span className='text-gray-500 text-xs ml-1'>(optional)</span>
              </label>
              <input
                type='number'
                value={delay}
                onChange={(e) => setDelay(Number(e.target.value))}
                className='w-full p-2 rounded border border-gray-500' style={{backgroundColor: '#0d0d0d', color: '#e2e2e2'}}
                min='0'
                placeholder='0'
              />
            </div>
          </div>
          <div className='mb-4'>
            <div className='flex justify-between items-center mb-1'>
              <label className='block text-sm font-medium'>Response Body</label>
              <button
                type='button'
                onClick={handleBeautifyJson}
                onMouseDown={() => console.log('Edit Modal - Mouse down on Beautify button')}
                onMouseUp={() => console.log('Edit Modal - Mouse up on Beautify button')}
                className='px-3 py-1 text-xs bg-green-600 rounded hover:bg-green-500 transition'
                style={{cursor: 'pointer', zIndex: 1000}}
              >
                Beautify JSON
              </button>
            </div>
            <textarea
              value={responseBody}
              onChange={(e) => setResponseBody(e.target.value)}
              className='w-full p-2 rounded border border-gray-500 font-mono whitespace-pre' style={{backgroundColor: '#0d0d0d', color: '#e2e2e2'}}
              rows={4}
              placeholder='{"message": "Hello World"}'
            />
          </div>

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