// backend/src/utils/encryption.js
// Utilidades para encriptar/desencriptar datos sensibles

const crypto = require('crypto');

// Clave de encriptación (en producción debe estar en variable de entorno)
// AES-256 requiere exactamente 32 bytes (256 bits)
const getEncryptionKey = () => {
    const keyString = process.env.ENCRYPTION_KEY || 'a_very_secret_key_for_encryption_32_bytes_long_key_here';
    
    // Si la clave es hexadecimal (64 caracteres = 32 bytes)
    if (/^[0-9a-fA-F]{64}$/.test(keyString)) {
        return Buffer.from(keyString, 'hex');
    }
    
    // Si es un string normal, generar hash SHA-256 para obtener exactamente 32 bytes
    return crypto.createHash('sha256').update(keyString).digest();
};

const ENCRYPTION_KEY = getEncryptionKey();
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16; // Para AES, el IV siempre es de 16 bytes

/**
 * Encriptar texto
 * @param {string} text - Texto a encriptar
 * @returns {string} - Texto encriptado en formato base64
 */
function encrypt(text) {
    if (!text) return null;
    
    try {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
        
        let encrypted = cipher.update(text, 'utf8', 'base64');
        encrypted += cipher.final('base64');
        
        // Combinar IV y texto encriptado
        return iv.toString('base64') + ':' + encrypted;
    } catch (error) {
        console.error('Error encriptando:', error);
        throw new Error('Error al encriptar datos');
    }
}

/**
 * Desencriptar texto
 * @param {string} encryptedText - Texto encriptado en formato base64
 * @returns {string} - Texto desencriptado
 */
function decrypt(encryptedText) {
    if (!encryptedText) return null;
    
    try {
        const parts = encryptedText.split(':');
        if (parts.length !== 2) {
            throw new Error('Formato de texto encriptado inválido');
        }
        
        const iv = Buffer.from(parts[0], 'base64');
        const encrypted = parts[1];
        
        const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
        let decrypted = decipher.update(encrypted, 'base64', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    } catch (error) {
        console.error('Error desencriptando:', error);
        throw new Error('Error al desencriptar datos');
    }
}

/**
 * Encriptar documento (base64)
 * @param {string} base64Data - Datos en base64
 * @returns {string} - Datos encriptados en base64
 */
function encryptDocument(base64Data) {
    if (!base64Data) return null;
    
    // Si ya está encriptado, retornar tal cual
    if (base64Data.includes(':')) {
        return base64Data;
    }
    
    return encrypt(base64Data);
}

/**
 * Desencriptar documento
 * @param {string} encryptedData - Datos encriptados
 * @returns {string} - Datos desencriptados en base64
 */
function decryptDocument(encryptedData) {
    if (!encryptedData) return null;
    
    // Si no está encriptado (no tiene :), retornar tal cual
    if (!encryptedData.includes(':')) {
        return encryptedData;
    }
    
    return decrypt(encryptedData);
}

/**
 * Generar hash de clave (para verificación)
 * @param {string} key - Clave
 * @returns {string} - Hash SHA256
 */
function hashKey(key) {
    return crypto.createHash('sha256').update(key).digest('hex');
}

module.exports = {
    encrypt,
    decrypt,
    encryptDocument,
    decryptDocument,
    hashKey,
    ENCRYPTION_KEY
};

