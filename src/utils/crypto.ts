import CryptoJS from 'crypto-js';

export const encryptMetadata = (metadata: Record<string, any>, password: string): string => {
  const metadataString = JSON.stringify(metadata);
  return CryptoJS.AES.encrypt(metadataString, password).toString();
};

export const decryptMetadata = (encryptedData: string, password: string): Record<string, any> | null => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, password);
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decryptedString);
  } catch (error) {
    console.error('Failed to decrypt metadata:', error);
    return null;
  }
};