// Mock data storage for development
const mockStorage = {
  collections: [
    {
      id: "1",
      name: "User API",
      description: "Mock user endpoints",
      port: 3001,
      base_path: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  routes: [
    {
      id: "1",
      collection_id: "1",
      name: "Get Users",
      method: "GET",
      path: "/users",
      status_code: 200,
      response_body: JSON.stringify(
        [
          { id: 1, name: "John Doe" },
          { id: 2, name: "Jane Smith" },
        ],
        null,
        2
      ),
      response_headers: {
        "Content-Type": "application/json",
      },
      delay_ms: 0,
    },
  ],
  servers: [],
  runningServers: new Set() // Track which collections have running servers
};

const mockTauri = {
  invoke: async (command, args) => {
    console.log("Mock Tauri command:", command, args);

    // Mock responses
    switch (command) {
      case "get_collections":
        return mockStorage.collections;
      case "get_routes":
        return mockStorage.routes.filter(route => route.collection_id === (args.collection_id || args.collectionId));
      case "get_running_servers":
        return mockStorage.collections.map(collection => ({
          port: collection.port,
          collection_id: collection.id,
          collection_name: collection.name,
          is_running: mockStorage.runningServers.has(collection.id),
          base_url: `http://localhost:${collection.port}`
        }));
      case "create_collection":
        console.log("Creating collection:", args);
        const newCollection = { 
          id: Date.now().toString(),
          name: args.request.name,
          description: args.request.description,
          port: args.request.port,
          base_path: args.request.base_path,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        mockStorage.collections.push(newCollection);
        return newCollection;
      case "create_route":
        console.log("Creating route:", args);
        const routeData = args.request || args;
        const newRoute = {
          id: Date.now().toString(),
          collection_id: routeData.collection_id,
          name: routeData.name,
          method: routeData.method,
          path: routeData.path,
          status_code: routeData.status_code,
          response_body: routeData.response_body,
          response_headers: routeData.response_headers,
          delay_ms: routeData.delay_ms,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        mockStorage.routes.push(newRoute);
        return newRoute;
      case "update_collection":
        console.log("Updating collection:", args);
        const collectionIndex = mockStorage.collections.findIndex(c => c.id === args.request.id);
        if (collectionIndex !== -1) {
          mockStorage.collections[collectionIndex] = {
            ...mockStorage.collections[collectionIndex],
            ...args.request,
            updated_at: new Date().toISOString()
          };
          return mockStorage.collections[collectionIndex];
        }
        throw new Error("Collection not found");
      case "update_route":
        console.log("Updating route:", args);
        const routeIndex = mockStorage.routes.findIndex(r => r.id === args.request.id);
        if (routeIndex !== -1) {
          mockStorage.routes[routeIndex] = {
            ...mockStorage.routes[routeIndex],
            ...args.request,
            updated_at: new Date().toISOString()
          };
          return mockStorage.routes[routeIndex];
        }
        throw new Error("Route not found");
      case "delete_collection":
        console.log("Deleting collection:", args);
        mockStorage.collections = mockStorage.collections.filter(c => c.id !== args.id);
        mockStorage.routes = mockStorage.routes.filter(r => r.collection_id !== args.id);
        return { success: true };
      case "delete_route":
        console.log("Deleting route:", args);
        mockStorage.routes = mockStorage.routes.filter(r => r.id !== args.id);
        return { success: true };
      case "start_server":
        const collectionId = args.collection_id || args.collectionId;
        console.log("Starting server for collection:", collectionId);
        const targetCollection = mockStorage.collections.find(c => c.id === collectionId);
        if (!targetCollection) {
          throw new Error("Collection not found");
        }
        mockStorage.runningServers.add(collectionId);
        return {
          port: targetCollection.port,
          collection_id: targetCollection.id,
          collection_name: targetCollection.name,
          is_running: true,
          base_url: `http://localhost:${targetCollection.port}`
        };
      case "stop_server":
        console.log("Stopping server on port:", args.port);
        const collectionToStop = mockStorage.collections.find(c => c.port === args.port);
        if (collectionToStop) {
          mockStorage.runningServers.delete(collectionToStop.id);
          return { success: true };
        } else {
          throw new Error("Server not found");
        }
      case "test_route":
        console.log("Testing route:", args.request.route_id);
        const route = mockStorage.routes.find(r => r.id === args.request.route_id);
        const routeCollection = route ? mockStorage.collections.find(c => c.id === route.collection_id) : null;
        return { 
          url: `http://localhost:${routeCollection?.port || 3000}${route?.path || '/'}`,
          method: route?.method || "GET",
          status_code: route?.status_code || 200, 
          response_time_ms: Math.floor(Math.random() * 100) + 10,
          body: route?.response_body || JSON.stringify({ message: "Test successful", data: { id: 1, name: "Test User" } }, null, 2),
          headers: route?.response_headers || { "Content-Type": "application/json", "X-Test-Result": "success" }
        };
      default:
        return { success: true };
    }
  },
};

// Check if Tauri is available
let realInvoke = null;
if (typeof window !== 'undefined' && window.__TAURI__) {
  try {
    // Try to access Tauri invoke function
    if (typeof window.invoke === 'function') {
      realInvoke = window.invoke;
    } else if (typeof window.__TAURI_INVOKE__ === 'function') {
      realInvoke = window.__TAURI_INVOKE__;
    } else {
      const tauriApi = window.__TAURI__.tauri || window.__TAURI__.core || window.__TAURI__;
      if (tauriApi && typeof tauriApi.invoke === 'function') {
        realInvoke = tauriApi.invoke;
      }
    }
  } catch (e) {
    console.log("Error accessing Tauri API:", e);
  }
}

// Use real Tauri if available, otherwise use mock
export const tauri = {
  invoke: realInvoke || mockTauri.invoke
};

export const isUsingMockTauri = !realInvoke;