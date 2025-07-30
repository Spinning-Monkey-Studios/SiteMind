import { GoogleGenAI, Modality } from "@google/genai";
import * as fs from 'fs';
import { EncryptionService } from "./encryption";
import type { WordPressSite } from '@shared/schema';
import type { AIServiceInterface } from './ai-factory';

export class GeminiService implements AIServiceInterface {
  private ai: GoogleGenAI | null = null;

  constructor(apiKey?: string) {
    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
    }
  }

  static async createFromUserKey(userId: string, storage: any): Promise<GeminiService> {
    try {
      const userApiKeys = await storage.getUserApiKeys(userId);
      const geminiKey = userApiKeys.find((key: any) => 
        key.provider === 'google' || key.provider === 'gemini'
      );
      
      if (geminiKey && geminiKey.encryptedKey) {
        const decryptedKey = await EncryptionService.decrypt(geminiKey.encryptedKey);
        return new GeminiService(decryptedKey);
      }
      
      // Fallback to environment variable
      if (process.env.GEMINI_API_KEY) {
        return new GeminiService(process.env.GEMINI_API_KEY);
      }
      
      throw new Error('No Gemini API key found');
    } catch (error) {
      console.error('Error creating Gemini service:', error);
      throw error;
    }
  }

  async generateResponse(prompt: string, model: string = "gemini-2.5-flash"): Promise<string> {
    if (!this.ai) {
      throw new Error('Gemini service not initialized');
    }

    try {
      const response = await this.ai.models.generateContent({
        model,
        contents: prompt,
      });

      return response.text || "Sorry, I couldn't generate a response.";
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error('Failed to generate response from Gemini');
    }
  }

  async analyzeConsoleErrors(errors: string[]): Promise<string> {
    if (!this.ai) {
      throw new Error('Gemini service not initialized');
    }

    const prompt = `Analyze these JavaScript/web console errors and provide actionable solutions:

${errors.map((error, index) => `${index + 1}. ${error}`).join('\n')}

Please provide:
1. Root cause analysis for each error
2. Step-by-step solutions
3. Prevention strategies
4. Code examples if applicable

Focus on WordPress-specific issues and common web development problems.`;

    return await this.generateResponse(prompt, "gemini-2.5-pro");
  }

  async analyzeLayoutAndImages(description: string, imageData?: string): Promise<string> {
    if (!this.ai) {
      throw new Error('Gemini service not initialized');
    }

    let contents: any[] = [
      `Analyze this website layout and provide improvement suggestions:

${description}

Please provide:
1. Layout structure analysis
2. Design improvement suggestions
3. User experience recommendations
4. Accessibility considerations
5. Mobile responsiveness suggestions
6. Color scheme and typography recommendations`
    ];

    if (imageData) {
      contents.unshift({
        inlineData: {
          data: imageData,
          mimeType: "image/jpeg",
        },
      });
    }

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents,
      });

      return response.text || "Unable to analyze the layout.";
    } catch (error) {
      console.error('Layout analysis error:', error);
      throw new Error('Failed to analyze layout');
    }
  }

  async generateGraphicsPrompt(section: string, style: string, purpose: string): Promise<string> {
    if (!this.ai) {
      throw new Error('Gemini service not initialized');
    }

    const prompt = `Generate a detailed prompt for creating graphics for a website section:

Section: ${section}
Style: ${style}
Purpose: ${purpose}

Create a comprehensive prompt that includes:
1. Visual style description
2. Color palette suggestions
3. Composition elements
4. Typography considerations
5. Mood and atmosphere
6. Technical specifications (dimensions, format)
7. Brand alignment suggestions

The prompt should be suitable for AI image generation tools like DALL-E, Midjourney, or Stable Diffusion.`;

    return await this.generateResponse(prompt, "gemini-2.5-pro");
  }

  async generateCustomGraphics(prompt: string, outputPath: string): Promise<void> {
    if (!this.ai) {
      throw new Error('Gemini service not initialized');
    }

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.0-flash-preview-image-generation",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          responseModalities: [Modality.TEXT, Modality.IMAGE],
        },
      });

      const candidates = response.candidates;
      if (!candidates || candidates.length === 0) {
        throw new Error('No image generated');
      }

      const content = candidates[0].content;
      if (!content || !content.parts) {
        throw new Error('No content parts in response');
      }

      for (const part of content.parts) {
        if (part.inlineData && part.inlineData.data) {
          const imageData = Buffer.from(part.inlineData.data, "base64");
          fs.writeFileSync(outputPath, imageData);
          console.log(`Image saved as ${outputPath}`);
          return;
        }
      }

      throw new Error('No image data found in response');
    } catch (error) {
      console.error('Image generation error:', error);
      throw new Error('Failed to generate custom graphics');
    }
  }

  async generateBlogContent(topic: string, style: string, wordCount: number = 800): Promise<string> {
    if (!this.ai) {
      throw new Error('Gemini service not initialized');
    }

    const prompt = `Write a comprehensive blog post about: ${topic}

Requirements:
- Style: ${style}
- Word count: approximately ${wordCount} words
- Include engaging title and meta description
- Structure with headers and subheaders
- Include actionable tips and insights
- SEO-optimized content
- WordPress-ready formatting with proper HTML tags

Format the response as:
TITLE: [Blog Post Title]
META_DESCRIPTION: [SEO meta description]
CONTENT: [Full blog post content with HTML formatting]
TAGS: [Relevant WordPress tags]
CATEGORIES: [Suggested WordPress categories]`;

    return await this.generateResponse(prompt, "gemini-2.5-pro");
  }

  async suggestFreeGraphics(theme: string, section: string): Promise<string> {
    if (!this.ai) {
      throw new Error('Gemini service not initialized');
    }

    const prompt = `Suggest free and royalty-free graphics sources for a WordPress website:

Theme: ${theme}
Section: ${section}

Provide:
1. Specific search terms for stock photo sites
2. Recommended free stock photo websites (Unsplash, Pexels, Pixabay, etc.)
3. Icon libraries and resources
4. Illustration resources
5. Background pattern suggestions
6. Color scheme recommendations
7. Direct URLs to relevant graphics when possible

Focus on high-quality, professional resources that are completely free for commercial use.`;

    return await this.generateResponse(prompt, "gemini-2.5-flash");
  }

  // Implement AIServiceInterface methods
  async processWordPressCommand(
    userMessage: string,
    siteContext?: WordPressSite & { decryptedPassword: string }
  ): Promise<{
    content: string;
    metadata?: any;
    actions?: Array<{
      type: string;
      description: string;
      params: any;
    }>;
  }> {
    const prompt = `You are an expert WordPress assistant. Analyze this user request and provide a helpful response with actionable steps.

User Request: ${userMessage}

${siteContext ? `Site Context:
- Site Name: ${siteContext.siteName}
- URL: ${siteContext.siteUrl}  
- Description: ${siteContext.description || 'No description'}
` : ''}

Provide a comprehensive response that includes:
1. Clear explanation of what needs to be done
2. Step-by-step instructions
3. Any WordPress-specific considerations
4. Potential risks or precautions

Format your response as helpful, actionable guidance for managing the WordPress site.`;

    const content = await this.generateResponse(prompt, "gemini-2.5-pro");
    
    return {
      content,
      metadata: {
        model: "gemini-2.5-pro",
        provider: "gemini"
      }
    };
  }

  async analyzeSiteContent(content: string): Promise<{
    suggestions: string[];
    seoScore: number;
    readabilityScore: number;
  }> {
    const prompt = `Analyze this website content for SEO and readability. Provide scores (0-100) and actionable suggestions:

Content: ${content}

Please provide:
1. SEO Score (0-100)
2. Readability Score (0-100)  
3. 5-7 specific improvement suggestions

Format as JSON: {"seoScore": number, "readabilityScore": number, "suggestions": []}`;

    try {
      const response = await this.ai?.models.generateContent({
        model: "gemini-2.5-pro",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const result = JSON.parse(response?.text || '{}');
      return {
        suggestions: result.suggestions || [],
        seoScore: result.seoScore || 0,
        readabilityScore: result.readabilityScore || 0
      };
    } catch (error) {
      console.error('Content analysis error:', error);
      return {
        suggestions: ["Unable to analyze content at this time"],
        seoScore: 0,
        readabilityScore: 0
      };
    }
  }

  async generateThemeRecommendations(
    siteType: string,
    preferences: any
  ): Promise<{
    themes: Array<{
      name: string;
      description: string;
      features: string[];
      price: string;
    }>;
  }> {
    const prompt = `Recommend WordPress themes for a ${siteType} website with these preferences: ${JSON.stringify(preferences)}

Provide 5 theme recommendations with:
- Theme name
- Description  
- Key features
- Pricing information

Format as JSON: {"themes": [{"name": "", "description": "", "features": [], "price": ""}]}`;

    try {
      const response = await this.ai?.models.generateContent({
        model: "gemini-2.5-pro",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const result = JSON.parse(response?.text || '{"themes": []}');
      return result;
    } catch (error) {
      console.error('Theme recommendation error:', error);
      return { themes: [] };
    }
  }

  async generatePluginRecommendations(
    siteNeeds: string[]
  ): Promise<{
    plugins: Array<{
      name: string;
      description: string;
      purpose: string;
      installation: string;
    }>;
  }> {
    const prompt = `Recommend WordPress plugins for these needs: ${siteNeeds.join(', ')}

Provide 5-7 plugin recommendations with:
- Plugin name
- Description
- Purpose/functionality
- Installation instructions

Format as JSON: {"plugins": [{"name": "", "description": "", "purpose": "", "installation": ""}]}`;

    try {
      const response = await this.ai?.models.generateContent({
        model: "gemini-2.5-pro", 
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const result = JSON.parse(response?.text || '{"plugins": []}');
      return result;
    } catch (error) {
      console.error('Plugin recommendation error:', error);
      return { plugins: [] };
    }
  }
}