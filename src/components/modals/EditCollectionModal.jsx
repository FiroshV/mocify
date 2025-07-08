import React, { useState, useEffect } from 'react';

const EditCollectionModal = ({ show, collection, onClose, onSave }) => {
  const [name, setName] = useState(collection?.name || "");
  const [description, setDescription] = useState(collection?.description || "");
  const [port, setPort] = useState(collection?.port || 3000);

  useEffect(() => {
    if (collection) {
      setName(collection.name || "");
      setDescription(collection.description || "");
      setPort(collection.port || 3000);
    }
  }, [collection]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ 
      id: collection.id,
      name, 
      description: description || null, 
      port 
    });
  };

  if (!show || !collection) return null;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-gray-800 p-6 rounded-lg w-96'>
        <h3 className='text-lg font-semibold mb-4'>Edit Collection</h3>
        <form onSubmit={handleSubmit}>
          <div className='mb-4'>
            <label className='block text-sm font-medium mb-2'>Name</label>
            <input
              type='text'
              value={name}
              onChange={(e) => setName(e.target.value)}
              className='w-full p-2 rounded border border-gray-500' style={{backgroundColor: '#0d0d0d', color: '#e2e2e2'}}
              required
            />
          </div>
          <div className='mb-4'>
            <label className='block text-sm font-medium mb-2'>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className='w-full p-2 rounded border border-gray-500' style={{backgroundColor: '#0d0d0d', color: '#e2e2e2'}}
              rows={3}
            />
          </div>
          <div className='mb-4'>
            <label className='block text-sm font-medium mb-2'>Port</label>
            <input
              type='number'
              value={port}
              onChange={(e) => setPort(Number(e.target.value))}
              className='w-full p-2 rounded border border-gray-500' style={{backgroundColor: '#0d0d0d', color: '#e2e2e2'}}
              required
            />
          </div>
          <div className='flex justify-end space-x-2'>
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
              Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCollectionModal;