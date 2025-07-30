import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { GeminiService } from './gemini';
import { storage } from '../storage';

export interface GraphicsSource {
  name: string;
  url: string;
  description: string;
  license: string;
  apiKey?: string;
}

export interface GraphicsRequest {
  theme: string;
  section: string;
  style: string;
  dimensions?: { width: number; height: number };
  keywords?: string[];
}

export class GraphicsService {
  private sources: GraphicsSource[] = [
    {
      name: 'Unsplash',
      url: 'https://api.unsplash.com',
      description: 'High-quality stock photos',
      license: 'Unsplash License (Free for commercial use)',
    },
    {
      name: 'Pexels',
      url: 'https://api.pexels.com/v1',
      description: 'Free stock photos and videos',
      license: 'Pexels License (Free for commercial use)',
    },
    {
      name: 'Pixabay',
      url: 'https://pixabay.com/api',
      description: 'Free images, vectors, and illustrations',
      license: 'Pixabay License (Free for commercial use)',
    }
  ];

  async searchUnsplash(query: string, count: number = 10): Promise<any[]> {
    try {
      const response = await axios.get(`https://api.unsplash.com/search/photos`, {
        params: {
          query,
          per_page: count,
          orientation: 'landscape',
        },
        headers: {
          'Authorization': `Client-ID ${process.env.UNSPLASH_ACCESS_KEY || 'demo-key'}`,
        },
      });

      return response.data.results.map((photo: any) => ({
        id: photo.id,
        url: photo.urls.regular,
        thumbnail: photo.urls.thumb,
        downloadUrl: photo.links.download,
        description: photo.description || photo.alt_description,
        author: photo.user.name,
        authorUrl: photo.user.links.html,
        source: 'Unsplash',
        license: 'Free for commercial use',
      }));
    } catch (error) {
      console.error('Unsplash API error:', error);
      return [];
    }
  }

  async searchPexels(query: string, count: number = 10): Promise<any[]> {
    try {
      const response = await axios.get(`https://api.pexels.com/v1/search`, {
        params: {
          query,
          per_page: count,
          orientation: 'landscape',
        },
        headers: {
          'Authorization': process.env.PEXELS_API_KEY || 'demo-key',
        },
      });

      return response.data.photos.map((photo: any) => ({
        id: photo.id,
        url: photo.src.large,
        thumbnail: photo.src.medium,
        downloadUrl: photo.src.original,
        description: photo.alt,
        author: photo.photographer,
        authorUrl: photo.photographer_url,
        source: 'Pexels',
        license: 'Free for commercial use',
      }));
    } catch (error) {
      console.error('Pexels API error:', error);
      return [];
    }
  }

  async searchPixabay(query: string, count: number = 10): Promise<any[]> {
    try {
      const response = await axios.get(`https://pixabay.com/api/`, {
        params: {
          key: process.env.PIXABAY_API_KEY || 'demo-key',
          q: query,
          per_page: count,
          image_type: 'photo',
          orientation: 'horizontal',
          safesearch: 'true',
        },
      });

      return response.data.hits.map((photo: any) => ({
        id: photo.id,
        url: photo.webformatURL,
        thumbnail: photo.previewURL,
        downloadUrl: photo.largeImageURL,
        description: photo.tags,
        author: photo.user,
        source: 'Pixabay',
        license: 'Free for commercial use',
      }));
    } catch (error) {
      console.error('Pixabay API error:', error);
      return [];
    }
  }

  async findFreeGraphics(request: GraphicsRequest): Promise<any[]> {
    const searchTerms = [
      request.theme,
      request.section,
      request.style,
      ...(request.keywords || [])
    ].filter(Boolean).join(' ');

    const results = await Promise.allSettled([
      this.searchUnsplash(searchTerms, 5),
      this.searchPexels(searchTerms, 5),
      this.searchPixabay(searchTerms, 5),
    ]);

    const allPhotos = results
      .filter((result): result is PromiseFulfilledResult<any[]> => result.status === 'fulfilled')
      .flatMap(result => result.value);

    // Sort by relevance (basic scoring based on description match)
    return allPhotos.sort((a, b) => {
      const scoreA = this.calculateRelevanceScore(a, searchTerms);
      const scoreB = this.calculateRelevanceScore(b, searchTerms);
      return scoreB - scoreA;
    });
  }

  private calculateRelevanceScore(photo: any, searchTerms: string): number {
    const description = (photo.description || '').toLowerCase();
    const terms = searchTerms.toLowerCase().split(' ');
    
    return terms.reduce((score, term) => {
      return score + (description.includes(term) ? 1 : 0);
    }, 0);
  }

  async downloadImage(url: string, filename: string): Promise<string> {
    try {
      const response = await axios.get(url, { 
        responseType: 'arraybuffer',
        timeout: 30000,
      });
      
      const uploadsDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      const filePath = path.join(uploadsDir, filename);
      fs.writeFileSync(filePath, response.data);
      
      return filePath;
    } catch (error) {
      console.error('Error downloading image:', error);
      throw new Error('Failed to download image');
    }
  }

  async generateCustomGraphics(userId: string, prompt: string, filename: string): Promise<string> {
    try {
      const geminiService = await GeminiService.createFromUserKey(userId, storage);
      const uploadsDir = path.join(process.cwd(), 'uploads');
      
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      const filePath = path.join(uploadsDir, filename);
      await geminiService.generateCustomGraphics(prompt, filePath);
      
      return filePath;
    } catch (error) {
      console.error('Error generating custom graphics:', error);
      throw new Error('Failed to generate custom graphics');
    }
  }

  getSources(): GraphicsSource[] {
    return this.sources;
  }
}

// Global graphics service instance
export const graphicsService = new GraphicsService();