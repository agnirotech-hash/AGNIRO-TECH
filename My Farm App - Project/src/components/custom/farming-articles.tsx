
"use client";

import React, { useState, useTransition, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Newspaper, Sparkles, Loader2, Archive, BookOpen, Trash2, UploadCloud, AlertTriangle, Download } from "lucide-react";
import { generateFarmingArticle, type FarmingArticleOutput, type FarmingArticleInput } from "@/ai/flows/generate-farming-article-flow";
import { useCropData } from "@/context/crop-data-context";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { FullArticleDialog } from "./full-article-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import jsPDF from 'jspdf';

export interface Article {
  id: string;
  title: string;
  source: string;
  date: string;
  summary?: string; 
  introduction?: string;
  bodySectionHints?: string[];
  fullArticleText?: string;
  conclusion?: string;
  imageUrl: string;
  imageHint: string;
  imagePromptSuggestion?: string;
  type: "ai-generated" | "ai-archived" | "static-archived";
  uploadedImageDataUri?: string;
}

const LOCAL_STORAGE_ARCHIVED_ARTICLES_KEY = "agniro_archivedAiArticles";
const LOCAL_STORAGE_DELETED_STATIC_IDS_KEY = "agniro_deletedStaticArticleIds";

const initialStaticArchiveArticles: Article[] = [
  {
    id: "static-article-1",
    title: "Archived: Revolutionizing Maize Farming with Precision Agriculture",
    source: "AgriTech Today (Archive)",
    date: "May 10, 2024",
    introduction: "This is an archived article placeholder. Drone technology and advanced soil sensors were instrumental in transforming maize farming practices across several districts in Uganda. Early adopters reported significant yield increases, often up to 30%, coupled with a reduction in input costs like fertilizers and pesticides.",
    fullArticleText: "The primary challenge was the initial investment and the need for specialized training, but cooperative models helped many smallholders access these technologies. The long-term impact included better land management and more resilient farming systems against climate variability. Further research showed that integrating weather data with sensor readings could optimize irrigation schedules, saving water while maximizing growth. Many young farmers were particularly keen to adopt these methods, seeing them as a pathway to more profitable and sustainable agriculture.",
    conclusion: "Ultimately, precision agriculture, exemplified by these early maize farming projects, set a new benchmark for efficiency and productivity in the region, paving the way for broader technological adoption.",
    imageUrl: "https://placehold.co/600x400.png",
    imageHint: "drone farm",
    type: "static-archived",
  },
  {
    id: "static-news-1",
    title: "Archived: New Drought-Resistant Cassava Variety Released",
    source: "NARO Archives",
    date: "May 15, 2024",
    introduction: "The release of the NAROCASS 1 variety by the National Agricultural Research Organisation marked a turning point for cassava farmers, especially in drought-prone areas. This variety not only offered better yield potential but also showed increased resistance to common diseases like Cassava Mosaic Disease.",
    fullArticleText: "Adoption rates were high, supported by government extension services and farmer field schools that demonstrated the benefits and proper agronomic practices for NAROCASS 1. Post-harvest handling improvements were also introduced alongside the new variety to ensure that the increased yields translated into better food security and market opportunities. The success of NAROCASS 1 spurred further research into other climate-resilient crop varieties.",
    conclusion: "This initiative significantly contributed to food security and showcased the power of agricultural research in addressing local challenges.",
    imageUrl: "https://placehold.co/600x400.png",
    imageHint: "cassava plant",
    type: "static-archived",
  },
];


export function FarmingArticles() {
  const [latestAiArticles, setLatestAiArticles] = useState<Article[]>([]);
  
  const [archivedAiArticles, setArchivedAiArticles] = useState<Article[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(LOCAL_STORAGE_ARCHIVED_ARTICLES_KEY);
      if (stored) {
        let parsedArticlesSource: any[] = [];
        try {
          parsedArticlesSource = JSON.parse(stored);
          if (!Array.isArray(parsedArticlesSource)) {
            console.warn("Archived articles data was not an array, resetting.");
            parsedArticlesSource = [];
          }
        } catch (e) { 
          console.error("Error parsing archived AI articles from localStorage:", e); 
          localStorage.removeItem(LOCAL_STORAGE_ARCHIVED_ARTICLES_KEY); // Clear corrupted data
        }

        if (parsedArticlesSource.length > 0) {
          return parsedArticlesSource
            .map((articleData: any): Article | null => {
                if (!articleData || typeof articleData !== 'object') {
                    console.warn("Invalid article data in localStorage, skipping.", articleData);
                    return null;
                }
                if (!articleData.id || !articleData.title || !articleData.type) {
                    console.warn("Skipping malformed article from localStorage (missing id, title, or type):", articleData);
                    return null;
                }
                return {
                    id: articleData.id,
                    title: articleData.title,
                    source: articleData.source || "Unknown Source",
                    date: articleData.date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
                    summary: articleData.summary || undefined,
                    introduction: articleData.introduction || undefined,
                    bodySectionHints: Array.isArray(articleData.bodySectionHints) ? articleData.bodySectionHints : [],
                    fullArticleText: articleData.fullArticleText || undefined,
                    conclusion: articleData.conclusion || undefined,
                    imageUrl: articleData.imageUrl || "https://placehold.co/600x400.png",
                    imageHint: articleData.imageHint || "article image",
                    imagePromptSuggestion: articleData.imagePromptSuggestion || undefined,
                    type: articleData.type,
                    uploadedImageDataUri: articleData.uploadedImageDataUri || undefined,
                };
            })
            .filter((article): article is Article => article !== null);
        }
      }
    }
    return [];
  });

  const [deletedStaticArticleIds, setDeletedStaticArticleIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(LOCAL_STORAGE_DELETED_STATIC_IDS_KEY);
      if (stored) {
        try {
          const parsedIds = JSON.parse(stored);
          return Array.isArray(parsedIds) ? parsedIds.filter(id => typeof id === 'string') : [];
        } catch (e) { 
          console.error("Error parsing deleted static article IDs from localStorage:", e);
          localStorage.removeItem(LOCAL_STORAGE_DELETED_STATIC_IDS_KEY);
        }
      }
    }
    return [];
  });

  const [displayableStaticArchiveArticles, setDisplayableStaticArchiveArticles] = useState<Article[]>(initialStaticArchiveArticles);

  const [isGeneratingArticle, startGeneratingArticleTransition] = useTransition();
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [articleTopic, setArticleTopic] = useState<string>("");
  const { defaultRegionName } = useCropData();
  const { toast } = useToast();

  const [selectedArticleForView, setSelectedArticleForView] = useState<Article | null>(null);
  const [isFullArticleDialogOpen, setIsFullArticleDialogOpen] = useState(false);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<Article | null>(null);

  useEffect(() => {
    setDisplayableStaticArchiveArticles(
      initialStaticArchiveArticles.filter(item => !deletedStaticArticleIds.includes(item.id))
    );
  }, [deletedStaticArticleIds]);

  const handleGenerateArticle = async () => {
    setGenerationError(null);
    startGeneratingArticleTransition(async () => {
      try {
        const input: FarmingArticleInput = {
          countryName: "Uganda",
          region: defaultRegionName || undefined,
          topic: articleTopic || "general farming best practices",
        };
        const result: FarmingArticleOutput = await generateFarmingArticle(input);
        const newArticle: Article = {
          id: `ai-gen-${Date.now()}`,
          title: result.title,
          source: result.source,
          date: result.date,
          introduction: result.introduction,
          bodySectionHints: result.bodySectionHints,
          fullArticleText: result.fullArticleText,
          conclusion: result.conclusion,
          imageUrl: `https://placehold.co/600x400.png`,
          imageHint: result.imageHint,
          type: "ai-generated",
          imagePromptSuggestion: result.imagePromptSuggestion,
        };
        setLatestAiArticles(prev => [newArticle, ...prev.slice(0, 2)]); 
        toast({
            title: "AI Article Generated",
            description: `A new article titled "${result.title}" is ready.`,
        });
      } catch (e) {
        console.error("AI Article Generation error:", e);
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
        setGenerationError(errorMessage);
        toast({
            variant: "destructive",
            title: "AI Article Generation Failed",
            description: errorMessage,
        });
      }
    });
  };

  const handleViewMore = (article: Article) => {
    setSelectedArticleForView(article);
    setIsFullArticleDialogOpen(true);
  };

  const handleSaveToArchive = (articleToSave: Article) => {
    const archivedItem: Article = {
        ...articleToSave,
        id: `ai-archived-${articleToSave.id.replace('ai-gen-','')}-${Date.now()}`, 
        type: "ai-archived",
        uploadedImageDataUri: articleToSave.uploadedImageDataUri,
    };
    
    setArchivedAiArticles(prev => {
      const updatedArchived = [archivedItem, ...prev];
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_ARCHIVED_ARTICLES_KEY, JSON.stringify(updatedArchived));
      }
      return updatedArchived;
    });
    
    setLatestAiArticles(prev => prev.filter(item => item.id !== articleToSave.id));
    
    toast({
        title: "Article Saved to Archive",
        description: `"${articleToSave.title}" has been permanently saved to your archive.`,
    });
  };
  
  const handleDeleteLatestAiArticle = (articleId: string) => {
    setLatestAiArticles(prev => prev.filter(item => item.id !== articleId));
    toast({ title: "AI Article Removed", description: "The AI-generated article has been removed from the latest list." });
  };

  const confirmDeleteArchivedArticle = () => {
    if (!articleToDelete) return;
    const articleId = articleToDelete.id;
    
    if (articleToDelete.type === "static-archived") {
      setDeletedStaticArticleIds(prevIds => {
        const newIds = [...new Set([...prevIds, articleId])];
        if (typeof window !== 'undefined') {
          localStorage.setItem(LOCAL_STORAGE_DELETED_STATIC_IDS_KEY, JSON.stringify(newIds));
        }
        return newIds;
      });
    } else { 
      setArchivedAiArticles(prev => {
        const updatedArchived = prev.filter(item => item.id !== articleId);
        if (typeof window !== 'undefined') {
          localStorage.setItem(LOCAL_STORAGE_ARCHIVED_ARTICLES_KEY, JSON.stringify(updatedArchived));
        }
        return updatedArchived;
      });
    }
    toast({ title: "Article Deleted", description: `"${articleToDelete.title}" has been permanently removed from the archive.` });
    setArticleToDelete(null);
    setIsDeleteDialogOpen(false);
  };

  const openDeleteDialog = (article: Article) => {
    setArticleToDelete(article);
    setIsDeleteDialogOpen(true);
  };

  const allArchivedArticles = [...displayableStaticArchiveArticles, ...archivedAiArticles].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>, articleId: string, listType: 'latest' | 'archived' | 'static-archived') => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageDataUri = reader.result as string;
        
        const updateList = (setter: React.Dispatch<React.SetStateAction<Article[]>>, currentList: Article[]) => {
            const updatedList = currentList.map(article =>
                article.id === articleId ? { ...article, uploadedImageDataUri: imageDataUri, imageUrl: '' } : article
            );
            setter(updatedList);
            return updatedList;
        };

        let updatedListForStorage: Article[] | undefined;

        if (listType === 'latest') {
            updateList(setLatestAiArticles, latestAiArticles);
        } else if (listType === 'archived') {
            updatedListForStorage = updateList(setArchivedAiArticles, archivedAiArticles);
             if (updatedListForStorage && typeof window !== 'undefined') {
                localStorage.setItem(LOCAL_STORAGE_ARCHIVED_ARTICLES_KEY, JSON.stringify(updatedListForStorage));
            }
        } else if (listType === 'static-archived') {
            setDisplayableStaticArchiveArticles(prev => prev.map(item => 
                item.id === articleId ? { ...item, uploadedImageDataUri: imageDataUri, imageUrl: '' } : item
            ));
        }
        toast({ title: "Image Selected", description: "Image will be used for this article in this session." });
      };
      reader.onerror = () => {
        toast({ variant: "destructive", title: "Image Upload Error", description: "Could not read the image file." });
      };
      reader.readAsDataURL(file);
    } else if (file) {
        toast({ variant: "destructive", title: "Invalid File Type", description: "Please select an image file." });
    }
  }, [toast, latestAiArticles, archivedAiArticles, displayableStaticArchiveArticles, setArchivedAiArticles, setLatestAiArticles, setDisplayableStaticArchiveArticles]);


  const handleDownloadPdf = (article: Article) => {
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 15;
    const maxLineWidth = pageWidth - margin * 2;
    let y = margin;

    const addText = (text: string, size: number, isBold = false, isItalic = false, currentY: number) => {
      doc.setFontSize(size);
      doc.setFont(undefined, isBold ? 'bold' : (isItalic ? 'italic' : 'normal'));
      const lines = doc.splitTextToSize(text, maxLineWidth);
      
      for (const line of lines) {
        if (currentY + (size / 2.83465) > pageHeight - margin) { 
          doc.addPage();
          currentY = margin;
        }
        doc.text(line, margin, currentY);
        currentY += (size / 2.83465) * 1.2; 
      }
      return currentY;
    };

    y = addText(article.title, 18, true, false, y);
    y += 5;
    y = addText(`Source: ${article.source}`, 10, false, true, y);
    y = addText(`Date: ${article.date}`, 10, false, true, y);
    y += 10;

    if (article.introduction) {
      y = addText("Introduction", 14, true, false, y);
      y = addText(article.introduction, 12, false, false, y);
      y += 7;
    }

    if (article.fullArticleText) {
      y = addText("Article Body", 14, true, false, y);
      y = addText(article.fullArticleText, 12, false, false, y);
      y += 7;
    }

    if (article.conclusion) {
      y = addText("Conclusion", 14, true, false, y);
      y = addText(article.conclusion, 12, false, false, y);
    }
    
    const safeTitle = article.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    doc.save(`${safeTitle.substring(0, 30)}.pdf`);
    toast({ title: "PDF Downloading", description: `"${article.title}.pdf" should start downloading.` });
  };

  const renderArticleCard = (article: Article, listType: 'latest' | 'archived' | 'static-archived') => {
    const handleDeleteClick = () => {
        if (listType === 'latest') {
            handleDeleteLatestAiArticle(article.id);
        } else {
            openDeleteDialog(article);
        }
    };
    const imageInputId = `upload-${article.id}-${listType}`;
    const displayType = article.type ? `(${article.type.replace(/-/g, ' ')})` : '';

    return (
        <Card key={article.id} className="flex flex-col overflow-hidden shadow-md hover:shadow-lg transition-shadow bg-card">
          <div className="relative w-full h-48">
            <Image
              src={article.uploadedImageDataUri || article.imageUrl || "https://placehold.co/600x400.png"}
              alt={article.title}
              fill
              style={{ objectFit: 'cover' }}
              data-ai-hint={article.imageHint}
              onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/600x400.png";}}
            />
          </div>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <CardTitle className="text-lg">{article.title}</CardTitle>
                <CardDescription className="text-xs">
                  {article.source} - {article.date} {displayType}
                </CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleDeleteClick}
                aria-label={`Delete article: ${article.title}`}
              >
                <Trash2 className="h-4 w-4 text-destructive hover:text-destructive/70" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-sm text-muted-foreground line-clamp-3 mb-2">{article.introduction || article.summary}</p>
            {article.imagePromptSuggestion && (
                <p className="text-xs text-muted-foreground/70 mt-1 italic">Image Idea: "{article.imagePromptSuggestion}"</p>
            )}
             <div className="mt-2">
                <Label htmlFor={imageInputId} className="text-xs text-primary hover:underline cursor-pointer flex items-center gap-1">
                    <UploadCloud className="h-3 w-3" /> Change Image (Session)
                </Label>
                <Input
                    id={imageInputId}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, article.id, listType)}
                />
            </div>
          </CardContent>
          <CardFooter className="pt-2 flex flex-col sm:flex-row items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleViewMore(article)} className="w-full sm:w-auto flex-1 hover:bg-primary/10 hover:border-primary">
                <BookOpen className="mr-2 h-4 w-4" /> Read Full Article
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleDownloadPdf(article)} className="w-full sm:w-auto flex-1 hover:bg-green-600/10 hover:border-green-600 hover:text-green-700">
                <Download className="mr-2 h-4 w-4" /> Download PDF
            </Button>
          </CardFooter>
        </Card>
    );
  };


  return (
    <div className="space-y-12">
      <section>
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
          <h3 className="text-2xl font-semibold text-primary flex items-center">
            <Sparkles className="mr-3 h-6 w-6 text-accent" /> AI-Generated Farming Articles
          </h3>
          <div className="flex items-end gap-2 w-full sm:w-auto">
            <div className="flex-grow sm:flex-grow-0">
              <Label htmlFor="article-topic" className="text-xs text-muted-foreground">Article Topic (Optional)</Label>
              <Input
                id="article-topic"
                type="text"
                placeholder="e.g., Soil Health, Maize Pests"
                value={articleTopic}
                onChange={(e) => setArticleTopic(e.target.value)}
                className="h-10"
              />
            </div>
            <Button onClick={handleGenerateArticle} disabled={isGeneratingArticle} className="bg-accent hover:bg-accent/90 text-accent-foreground h-10">
              {isGeneratingArticle ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Generate Article
            </Button>
          </div>
        </div>

        {generationError && (
          <Alert variant="destructive" className="mb-4">
             <AlertTriangle className="h-5 w-5" />
            <AlertTitle>Generation Error</AlertTitle>
            <AlertDescription>{generationError}</AlertDescription>
          </Alert>
        )}

        {latestAiArticles.length === 0 && !isGeneratingArticle && (
          <Card className="bg-card/50 border-dashed">
            <CardContent className="p-6 text-center text-muted-foreground">
              <p>Click "Generate Article" to see AI-written farming articles here.</p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {latestAiArticles.map((article) => {
            if (!article) return null;
            return renderArticleCard(article, 'latest');
          })}
        </div>
      </section>

      <Separator />

      <section>
        <h3 className="text-2xl font-semibold text-primary mb-6 flex items-center">
          <Archive className="mr-3 h-6 w-6" /> Articles & News Archive
        </h3>
        
        {allArchivedArticles.length === 0 ? (
          <p className="text-muted-foreground text-sm mb-8">No archived articles yet. Generate an article above and save it to see it here.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {allArchivedArticles.map((article) => {
                if (!article) return null;
                const listType = article.type === 'static-archived' ? 'static-archived' : 'archived';
                return renderArticleCard(article, listType);
            })}
          </div>
        )}
      </section>
      
      {selectedArticleForView && (
        <FullArticleDialog
          isOpen={isFullArticleDialogOpen}
          onOpenChange={setIsFullArticleDialogOpen}
          articleDetail={selectedArticleForView} 
          onSaveToArchive={handleSaveToArchive}
        />
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete "{articleToDelete?.title || 'this article'}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteArchivedArticle}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
