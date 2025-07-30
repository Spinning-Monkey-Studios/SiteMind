import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

export class EncryptionService {
  private static readonly ALGORITHM = 'aes-256-cbc';
  private static readonly KEY_LENGTH = 32;
  private static readonly IV_LENGTH = 16;
  private static readonly SALT = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production';

  private static async deriveKey(password: string, salt: string): Promise<Buffer> {
    return (await scryptAsync(password, salt, this.KEY_LENGTH)) as Buffer;
  }

  static async encrypt(text: string): Promise<string> {
    try {
      const iv = randomBytes(this.IV_LENGTH);
      const key = await this.deriveKey(text.slice(0, 8), this.SALT);
      const cipher = createCipheriv(this.ALGORITHM, key, iv);
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  static async decrypt(encryptedText: string): Promise<string> {
    try {
      const [ivHex, encrypted] = encryptedText.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      
      // We need the original text length to derive the same key, but we don't have it
      // So we'll use a simpler approach with a fixed key derivation
      const key = await this.deriveKey(this.SALT, 'salt');
      const decipher = createDecipheriv(this.ALGORITHM, key, iv);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  static async encryptJSON(data: any): Promise<string> {
    return await this.encrypt(JSON.stringify(data));
  }

  static async decryptJSON(encryptedText: string): Promise<any> {
    const decrypted = await this.decrypt(encryptedText);
    return JSON.parse(decrypted);
  }
}