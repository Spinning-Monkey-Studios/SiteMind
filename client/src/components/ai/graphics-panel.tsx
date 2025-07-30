import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Image, Download, Wand2, Search, Palette, FileImage } from 'lucide-react';

interface GraphicsResult {
  id: string;
  url: string;
  thumbnail: string;
  downloadUrl: string;
  description: string;
  author: string;
  source: string;
  license: string;
}

export function GraphicsPanel() {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useState({
    theme: '',
    section: '',
    style: '',
    keywords: ''
  });
  const [promptParams, setPromptParams] = useState({
    section: '',
    style: '',
    purpose: ''
  });
  const [generateParams, setGenerateParams] = useState({
    prompt: '',
    filename: ''
  });
  const [blogParams, setBlogParams] = useState({
    topic: '',
    style: '',
    wordCount: 800
  });

  // Search for free graphics
  const searchGraphicsMutation = useMutation({
    mutationFn: async (params: any) => {
      return await apiRequest('/api/graphics/search', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    },
    onError: (error) => {
      toast({
        title: "Error searching graphics",
        description: "Failed to search for graphics",
        variant: "destructive",
      });
    },
  });

  // Get AI suggestions for graphics
  const suggestionsMutation = useMutation({
    mutationFn: async (params: { theme: string; section: string }) => {
      return await apiRequest('/api/graphics/suggestions', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    },
    onError: (error) => {
      toast({
        title: "Error getting suggestions",
        description: "Failed to get AI suggestions",
        variant: "destructive",
      });
    },
  });

  // Generate graphics prompt
  const promptMutation = useMutation({
    mutationFn: async (params: any) => {
      return await apiRequest('/api/graphics/generate-prompt', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    },
    onSuccess: (data) => {
      setGenerateParams(prev => ({ ...prev, prompt: data.prompt }));
      toast({
        title: "Prompt generated",
        description: "AI has generated a detailed graphics prompt",
      });
    },
    onError: (error) => {
      toast({
        title: "Error generating prompt",
        description: "Failed to generate graphics prompt",
        variant: "destructive",
      });
    },
  });

  // Generate custom graphics
  const generateMutation = useMutation({
    mutationFn: async (params: any) => {
      return await apiRequest('/api/graphics/generate', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Graphics generated",
        description: "Custom graphics have been generated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error generating graphics",
        description: "Failed to generate custom graphics",
        variant: "destructive",
      });
    },
  });

  // Generate blog content
  const blogMutation = useMutation({
    mutationFn: async (params: any) => {
      return await apiRequest('/api/content/generate-blog', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Blog content generated",
        description: "AI has generated blog content successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error generating blog",
        description: "Failed to generate blog content",
        variant: "destructive",
      });
    },
  });

  // Download image
  const downloadMutation = useMutation({
    mutationFn: async (params: { url: string; filename: string }) => {
      return await apiRequest('/api/graphics/download', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Image downloaded",
        description: "Image has been downloaded successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error downloading image",
        description: "Failed to download image",
        variant: "destructive",
      });
    },
  });

  const handleSearchGraphics = () => {
    if (!searchParams.theme && !searchParams.section) {
      toast({
        title: "Missing information",
        description: "Please provide at least a theme or section",
        variant: "destructive",
      });
      return;
    }
    
    searchGraphicsMutation.mutate({
      ...searchParams,
      keywords: searchParams.keywords.split(',').map(k => k.trim()).filter(Boolean)
    });
  };

  const handleGetSuggestions = () => {
    if (!searchParams.theme || !searchParams.section) {
      toast({
        title: "Missing information",
        description: "Please provide both theme and section for suggestions",
        variant: "destructive",
      });
      return;
    }
    
    suggestionsMutation.mutate({
      theme: searchParams.theme,
      section: searchParams.section
    });
  };

  const handleGeneratePrompt = () => {
    if (!promptParams.section || !promptParams.style || !promptParams.purpose) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields for prompt generation",
        variant: "destructive",
      });
      return;
    }
    
    promptMutation.mutate(promptParams);
  };

  const handleGenerateGraphics = () => {
    if (!generateParams.prompt) {
      toast({
        title: "Missing prompt",
        description: "Please provide a graphics prompt",
        variant: "destructive",
      });
      return;
    }
    
    generateMutation.mutate(generateParams);
  };

  const handleGenerateBlog = () => {
    if (!blogParams.topic || !blogParams.style) {
      toast({
        title: "Missing information",
        description: "Please provide topic and style for blog generation",
        variant: "destructive",
      });
      return;
    }
    
    blogMutation.mutate(blogParams);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Palette className="h-5 w-5" />
        <h2 className="text-2xl font-semibold">AI Graphics & Content</h2>
      </div>

      <Tabs defaultValue="search" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="search">Search Graphics</TabsTrigger>
          <TabsTrigger value="generate">Generate Graphics</TabsTrigger>
          <TabsTrigger value="blog">Blog Content</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Search Free Graphics</CardTitle>
              <CardDescription>
                Find free and royalty-free graphics from Unsplash, Pexels, and Pixabay
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="theme">Theme</Label>
                  <Input
                    id="theme"
                    placeholder="e.g., Business, Technology, Nature"
                    value={searchParams.theme}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, theme: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="section">Section</Label>
                  <Input
                    id="section"
                    placeholder="e.g., Header, Hero, Background"
                    value={searchParams.section}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, section: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="style">Style</Label>
                  <Select value={searchParams.style} onValueChange={(value) => setSearchParams(prev => ({ ...prev, style: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="modern">Modern</SelectItem>
                      <SelectItem value="minimalist">Minimalist</SelectItem>
                      <SelectItem value="corporate">Corporate</SelectItem>
                      <SelectItem value="creative">Creative</SelectItem>
                      <SelectItem value="elegant">Elegant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                  <Input
                    id="keywords"
                    placeholder="e.g., professional, clean, blue"
                    value={searchParams.keywords}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, keywords: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSearchGraphics} disabled={searchGraphicsMutation.isPending}>
                  <Search className="h-4 w-4 mr-2" />
                  {searchGraphicsMutation.isPending ? "Searching..." : "Search Graphics"}
                </Button>
                <Button variant="outline" onClick={handleGetSuggestions} disabled={suggestionsMutation.isPending}>
                  <Wand2 className="h-4 w-4 mr-2" />
                  {suggestionsMutation.isPending ? "Getting Suggestions..." : "Get AI Suggestions"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {suggestionsMutation.data && (
            <Card>
              <CardHeader>
                <CardTitle>AI Suggestions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <div className="whitespace-pre-wrap">{suggestionsMutation.data.suggestions}</div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="generate" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Generate Graphics Prompt</CardTitle>
                <CardDescription>
                  Create detailed prompts for AI image generation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="prompt-section">Section</Label>
                  <Input
                    id="prompt-section"
                    placeholder="e.g., Hero banner, About section"
                    value={promptParams.section}
                    onChange={(e) => setPromptParams(prev => ({ ...prev, section: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="prompt-style">Style</Label>
                  <Input
                    id="prompt-style"
                    placeholder="e.g., Minimalist, Corporate, Artistic"
                    value={promptParams.style}
                    onChange={(e) => setPromptParams(prev => ({ ...prev, style: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="prompt-purpose">Purpose</Label>
                  <Input
                    id="prompt-purpose"
                    placeholder="e.g., Attract customers, Show professionalism"
                    value={promptParams.purpose}
                    onChange={(e) => setPromptParams(prev => ({ ...prev, purpose: e.target.value }))}
                  />
                </div>
                <Button onClick={handleGeneratePrompt} disabled={promptMutation.isPending}>
                  <Wand2 className="h-4 w-4 mr-2" />
                  {promptMutation.isPending ? "Generating..." : "Generate Prompt"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Generate Custom Graphics</CardTitle>
                <CardDescription>
                  Use AI to create custom graphics with Gemini
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="graphics-prompt">Graphics Prompt</Label>
                  <Textarea
                    id="graphics-prompt"
                    placeholder="Detailed description of the graphics you want to generate..."
                    value={generateParams.prompt}
                    onChange={(e) => setGenerateParams(prev => ({ ...prev, prompt: e.target.value }))}
                    rows={4}
                  />
                </div>
                <div>
                  <Label htmlFor="filename">Filename (optional)</Label>
                  <Input
                    id="filename"
                    placeholder="my-custom-graphic.jpg"
                    value={generateParams.filename}
                    onChange={(e) => setGenerateParams(prev => ({ ...prev, filename: e.target.value }))}
                  />
                </div>
                <Button onClick={handleGenerateGraphics} disabled={generateMutation.isPending}>
                  <FileImage className="h-4 w-4 mr-2" />
                  {generateMutation.isPending ? "Generating..." : "Generate Graphics"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="blog" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generate Blog Content</CardTitle>
              <CardDescription>
                Create SEO-optimized blog content with AI
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="blog-topic">Topic</Label>
                  <Input
                    id="blog-topic"
                    placeholder="e.g., WordPress SEO Best Practices"
                    value={blogParams.topic}
                    onChange={(e) => setBlogParams(prev => ({ ...prev, topic: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="blog-style">Writing Style</Label>
                  <Select value={blogParams.style} onValueChange={(value) => setBlogParams(prev => ({ ...prev, style: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="beginner-friendly">Beginner-friendly</SelectItem>
                      <SelectItem value="conversational">Conversational</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="word-count">Word Count</Label>
                <Input
                  id="word-count"
                  type="number"
                  min="300"
                  max="3000"
                  value={blogParams.wordCount}
                  onChange={(e) => setBlogParams(prev => ({ ...prev, wordCount: parseInt(e.target.value) }))}
                />
              </div>
              <Button onClick={handleGenerateBlog} disabled={blogMutation.isPending}>
                <FileImage className="h-4 w-4 mr-2" />
                {blogMutation.isPending ? "Generating..." : "Generate Blog Content"}
              </Button>
            </CardContent>
          </Card>

          {blogMutation.data && (
            <Card>
              <CardHeader>
                <CardTitle>Generated Blog Content</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <div className="whitespace-pre-wrap">{blogMutation.data.content}</div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          {searchGraphicsMutation.data && (
            <Card>
              <CardHeader>
                <CardTitle>Graphics Search Results</CardTitle>
                <CardDescription>
                  {searchGraphicsMutation.data.graphics?.length || 0} graphics found
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {searchGraphicsMutation.data.graphics?.map((graphic: GraphicsResult) => (
                    <div key={graphic.id} className="border rounded-lg p-4 space-y-2">
                      <img 
                        src={graphic.thumbnail} 
                        alt={graphic.description}
                        className="w-full h-32 object-cover rounded"
                      />
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground line-clamp-2">{graphic.description}</p>
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary">{graphic.source}</Badge>
                          <Button 
                            size="sm" 
                            onClick={() => downloadMutation.mutate({ 
                              url: graphic.downloadUrl, 
                              filename: `${graphic.id}.jpg` 
                            })}
                            disabled={downloadMutation.isPending}
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {generateMutation.data && (
            <Card>
              <CardHeader>
                <CardTitle>Generated Graphics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-green-600">{generateMutation.data.message}</p>
                  {generateMutation.data.downloadUrl && (
                    <div className="flex items-center gap-2">
                      <Button asChild>
                        <a href={generateMutation.data.downloadUrl} download>
                          <Download className="h-4 w-4 mr-2" />
                          Download Generated Image
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}