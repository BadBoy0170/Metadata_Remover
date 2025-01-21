import React, { useState, useCallback, useRef } from 'react';
import EXIF from 'exif-js';
import { Upload, Download, Image as ImageIcon, X, Check, Lock, Unlock } from 'lucide-react';
import { encryptMetadata, decryptMetadata } from './utils/crypto';

interface FileWithPreview extends File {
  preview?: string;
}

function App() {
  const [file, setFile] = useState<FileWithPreview | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [metadata, setMetadata] = useState<Record<string, any> | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [encryptedMetadata, setEncryptedMetadata] = useState<string | null>(null);
  const [decryptedMetadata, setDecryptedMetadata] = useState<Record<string, any> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('image/')) {
      handleFileSelect(droppedFile);
    }
  }, []);

  const handleFileSelect = (selectedFile: File) => {
    const fileWithPreview = selectedFile as FileWithPreview;
    fileWithPreview.preview = URL.createObjectURL(selectedFile);
    setFile(fileWithPreview);
    setProcessedImage(null);
    setEncryptedMetadata(null);
    setDecryptedMetadata(null);
    
    // Read metadata
    EXIF.getData(selectedFile as any, function(this: any) {
      const allMetadata = EXIF.getAllTags(this);
      setMetadata(allMetadata);
    });
  };

  const removeMetadata = async () => {
    if (!file || !canvasRef.current) return;
    
    setIsProcessing(true);
    
    try {
      // Create a new image without metadata
      const img = new Image();
      img.src = file.preview!;
      
      await new Promise((resolve) => {
        img.onload = () => {
          const canvas = canvasRef.current!;
          canvas.width = img.width;
          canvas.height = img.height;
          
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0);
          
          // Convert to blob and create URL
          canvas.toBlob((blob) => {
            if (blob) {
              const newUrl = URL.createObjectURL(blob);
              setProcessedImage(newUrl);
            }
            resolve(null);
          }, 'image/jpeg', 1.0);
        };
      });
    } catch (error) {
      console.error('Error processing image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEncryptMetadata = () => {
    if (!metadata || !password) return;
    const encrypted = encryptMetadata(metadata, password);
    setEncryptedMetadata(encrypted);
    
    // Create and trigger download of encrypted metadata
    const blob = new Blob([encrypted], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${file?.name || 'image'}.metadata`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDecryptMetadata = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !password) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const encryptedData = e.target?.result as string;
      const decrypted = decryptMetadata(encryptedData, password);
      setDecryptedMetadata(decrypted);
    };
    reader.readAsText(file);
  };

  const downloadImage = () => {
    if (!processedImage) return;
    
    const link = document.createElement('a');
    link.href = processedImage;
    link.download = 'cleaned-' + (file?.name || 'image.jpg');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Secure Metadata Manager
          </h1>
          <p className="text-lg text-gray-600">
            Remove, encrypt, and manage sensitive metadata from your images
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Upload Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors"
            >
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload className="w-12 h-12 text-gray-400 mb-4" />
                <span className="text-gray-600">
                  Drag and drop your image here or click to browse
                </span>
              </label>
            </div>

            {file && (
              <div className="mt-6">
                <div className="relative">
                  <img
                    src={file.preview}
                    alt="Preview"
                    className="rounded-lg w-full object-cover"
                    style={{ maxHeight: '300px' }}
                  />
                  <button
                    onClick={() => setFile(null)}
                    className="absolute top-2 right-2 p-1 bg-red-500 rounded-full text-white hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="mt-4 space-y-4">
                  <button
                    onClick={removeMetadata}
                    disabled={isProcessing}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <ImageIcon className="w-4 h-4" />
                    {isProcessing ? 'Processing...' : 'Remove Metadata'}
                  </button>

                  <div className="space-y-2">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter encryption password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    
                    <button
                      onClick={handleEncryptMetadata}
                      disabled={!metadata || !password}
                      className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Lock className="w-4 h-4" />
                      Encrypt & Save Metadata
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Results Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Results</h2>
            
            {metadata && Object.keys(metadata).length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Original Metadata</h3>
                <div className="bg-gray-50 rounded-lg p-4 max-h-40 overflow-y-auto">
                  {Object.entries(metadata).map(([key, value]) => (
                    <div key={key} className="text-sm mb-1">
                      <span className="font-medium">{key}:</span>{' '}
                      <span className="text-gray-600">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {processedImage && (
              <div className="mb-6">
                <div className="flex items-center gap-2 text-green-600 mb-4">
                  <Check className="w-5 h-5" />
                  <span>Metadata successfully removed!</span>
                </div>
                
                <button
                  onClick={downloadImage}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Cleaned Image
                </button>
              </div>
            )}

            <div className="border-t pt-4">
              <h3 className="text-lg font-medium mb-2">Decrypt Metadata</h3>
              <input
                type="file"
                accept=".metadata"
                onChange={handleDecryptMetadata}
                className="hidden"
                id="metadata-upload"
              />
              <label
                htmlFor="metadata-upload"
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Unlock className="w-4 h-4" />
                Load Encrypted Metadata
              </label>

              {decryptedMetadata && (
                <div className="mt-4">
                  <h4 className="text-md font-medium mb-2">Decrypted Metadata</h4>
                  <div className="bg-gray-50 rounded-lg p-4 max-h-40 overflow-y-auto">
                    {Object.entries(decryptedMetadata).map(([key, value]) => (
                      <div key={key} className="text-sm mb-1">
                        <span className="font-medium">{key}:</span>{' '}
                        <span className="text-gray-600">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {!metadata && !processedImage && !decryptedMetadata && (
              <div className="text-center text-gray-500 py-8">
                Upload an image to see the results
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}

export default App;