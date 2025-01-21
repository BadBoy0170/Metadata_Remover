# Secure Metadata Manager

A comprehensive tool for managing image metadata with encryption capabilities. Available as a web app, desktop application, or command-line interface.

## Features

- Remove metadata from images
- Encrypt and store metadata separately
- Decrypt stored metadata with password protection
- Web interface for easy access
- Desktop application for offline use
- CLI tool for automation and scripting

## Security Features

- AES encryption for metadata storage
- Password-protected encryption/decryption
- Separate storage of metadata and images
- Clean image generation without metadata
- No server-side storage of sensitive data

## Installation

### Web Version
```bash
# Clone the repository
git clone https://github.com/BadBoy0170/Metadata_Remover.git
cd secure-metadata-manager

# Install dependencies
npm install

# Start development server
npm run dev
```

### Desktop App
```bash
# Build desktop application
npm run build:electron
```

### CLI Tool
```bash
# Build CLI tool
npm run build:cli

# Run CLI commands
npm run cli -- <command>
```

## Usage

### Web Interface

1. **Upload Image**
   - Drag and drop an image or click to browse
   - View original metadata in the results panel

2. **Remove Metadata**
   - Click "Remove Metadata" to strip all EXIF data
   - Download the cleaned image

3. **Encrypt Metadata**
   - Enter a secure password
   - Click "Encrypt & Save Metadata"
   - Save the encrypted .metadata file

4. **Decrypt Metadata**
   - Enter the same password used for encryption
   - Click "Load Encrypted Metadata"
   - Select the .metadata file to view decrypted data

### CLI Commands

```bash
# Remove metadata
metadata-cli remove input.jpg output.jpg

# Remove and encrypt metadata
metadata-cli encrypt input.jpg output.jpg -p yourpassword

# Decrypt metadata
metadata-cli decrypt input.jpg.metadata -p yourpassword
```

### API Usage

```typescript
import { encryptMetadata, decryptMetadata } from './utils/crypto';

// Encrypt metadata
const encrypted = encryptMetadata(metadata, password);

// Decrypt metadata
const decrypted = decryptMetadata(encryptedData, password);
```

## Technical Details

### Encryption
- Uses AES encryption from CryptoJS
- Metadata is stored in separate .metadata files
- Password-based encryption for secure storage

### Image Processing
- Clean image generation using HTML Canvas
- Complete removal of EXIF data
- Maintains original image quality

### Security Considerations
- Client-side processing only
- No metadata stored on servers
- Secure password handling
- Encrypted metadata stored separately from images

## Development

### Prerequisites
- Node.js 18+
- npm or yarn
- Web browser for development

### Project Structure
```
secure-metadata-manager/
├── src/
│   ├── utils/
│   │   └── crypto.ts    # Encryption utilities
│   ├── App.tsx         # Main application
│   └── main.tsx        # Entry point
├── cli/
│   └── index.ts        # CLI implementation
└── package.json
```

### Building

```bash
# Build web application
npm run build

# Build CLI tool
npm run build:cli

# Build desktop app
npm run build:electron
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
