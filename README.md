# Mocify - API Mock Server for macOS

A powerful desktop application for mocking API requests on macOS (Apple Silicon), built with Rust, Tauri, and SQLite.

## Features

- 🚀 **Multiple Mock Servers**: Run multiple API mock servers simultaneously on different ports
- 🎯 **Route Management**: Define custom routes with specific request/response patterns
- 💾 **SQLite Storage**: Persistent storage of collections and routes
- ⚡ **Fast Response**: Built with Rust for optimal performance
- 🎨 **Modern UI**: Clean, Postman-like interface
- 🔧 **Flexible Configuration**: Set custom status codes, headers, response bodies, and delays
- 🧪 **Route Testing**: Test your mock routes directly from the app

## Prerequisites

- macOS (Apple Silicon M1/M2/M3)
- Rust (latest stable version)
- Node.js and npm
- Xcode Command Line Tools

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/mocify.git
   cd mocify
   ```

2. **Install Rust dependencies:**
   ```bash
   cargo build --release
   ```

3. **Set up the frontend:**
   ```bash
   cd src-tauri
   npm install
   ```

4. **Build the application:**
   ```bash
   cargo tauri build
   ```

The built application will be available in `src-tauri/target/release/bundle/macos/Mocify.app`

## Development

To run in development mode:

```bash
cargo tauri dev
```

## Project Structure

```
mocify/
├── src-tauri/
│   ├── src/
│   │   ├── main.rs          # Application entry point
│   │   ├── api.rs           # Tauri command handlers
│   │   ├── db.rs            # Database operations
│   │   ├── models.rs        # Data models
│   │   └── mock_server.rs   # Mock server implementation
│   ├── Cargo.toml           # Rust dependencies
│   ├── build.rs             # Build script
│   └── tauri.conf.json      # Tauri configuration
├── src/                     # Frontend files
└── README.md
```

## Usage

1. **Create a Collection**: Collections group related API endpoints
   - Set a name and port number
   - Optionally add a base path

2. **Add Routes**: Define mock endpoints within a collection
   - Choose HTTP method (GET, POST, PUT, DELETE, etc.)
   - Set the path (e.g., `/users`, `/api/products`)
   - Configure response status code
   - Add response headers (JSON format)
   - Define response body
   - Set optional delay (in milliseconds)

3. **Start Server**: Click the "Start" button to run the mock server
   - The server will listen on the specified port
   - Access your mocks at `http://localhost:[port][path]`

4. **Test Routes**: Use the built-in test feature to verify your mocks

## API Structure

### Collections
```json
{
  "id": "uuid",
  "name": "User API",
  "description": "Mock user endpoints",
  "port": 3001,
  "base_path": "/api/v1"
}
```

### Routes
```json
{
  "id": "uuid",
  "collection_id": "collection-uuid",
  "name": "Get Users",
  "method": "GET",
  "path": "/users",
  "status_code": 200,
  "response_body": "[{\"id\": 1, \"name\": \"John\"}]",
  "response_headers": {
    "Content-Type": "application/json"
  },
  "delay_ms": 500
}
```

## Building for Distribution

To create a distributable DMG:

```bash
cargo tauri build
```

The DMG will be created in `src-tauri/target/release/bundle/dmg/`

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with [Tauri](https://tauri.app/)
- Database powered by [SQLite](https://www.sqlite.org/) via [SQLx](https://github.com/launchbadge/sqlx)
- HTTP server built with [Axum](https://github.com/tokio-rs/axum)