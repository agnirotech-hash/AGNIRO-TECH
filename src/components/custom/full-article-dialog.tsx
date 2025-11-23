
"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BookOpen, Save, AlertTriangle, Loader2 } from "lucide-react"; 
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; 
import type { Article as ArticleType } from "./farming-articles";
import { Separator } from "../ui/separator";

interface FullArticleDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  articleDetail: ArticleType | null; 
  onSaveToArchive: (article: ArticleType) => void;
}

export function FullArticleDialog({ isOpen, onOpenChange, articleDetail, onSaveToArchive }: FullArticleDialogProps) {
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsSaving(false);
    }
  }, [isOpen]);

  const handleSave = () => {
    if (articleDetail) {
      setIsSaving(true);
      onSaveToArchive(articleDetail); 
      setTimeout(() => { 
        setIsSaving(false);
        onOpenChange(false); 
      }, 500);
    }
  };

  const renderArticleBody = () => {
    if (!articleDetail) {
        return <p className="text-muted-foreground">Article details could not be loaded.</p>;
    }
    if (!articleDetail.fullArticleText && !articleDetail.introduction && !articleDetail.conclusion && !articleDetail.summary) {
      return <p className="text-muted-foreground">No textual content available for this item.</p>;
    }

    const contentElements = [];
    
    if (articleDetail.introduction) {
        contentElements.push(
            <div key="intro-section" className="mb-4">
                <h4 className="text-lg font-semibold text-primary mb-2">Introduction</h4>
                <p className="text-foreground whitespace-pre-line leading-relaxed">{articleDetail.introduction}</p>
            </div>
        );
    }
    
    if (articleDetail.bodySectionHints && articleDetail.bodySectionHints.length > 0 && articleDetail.bodySectionHints.some(hint => hint.trim() !== "")) {
        contentElements.push(
            <div key="hints-section" className="mb-4">
                { (articleDetail.introduction) && <Separator className="my-4" />}
                <h4 className="text-lg font-semibold text-primary mb-2">Key Themes/Sections Suggested by AI</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 pl-4">
                    {articleDetail.bodySectionHints.map((hint, index) => hint.trim() !== "" && <li key={`hint-${index}`}>{hint}</li>)}
                </ul>
            </div>
        );
    }

    if (articleDetail.fullArticleText) {
        contentElements.push(
            <div key="body-main" className="mb-4">
                { (articleDetail.introduction || (articleDetail.bodySectionHints && articleDetail.bodySectionHints.length > 0)) && <Separator className="my-4" />}
                <h4 className="text-lg font-semibold text-primary mb-2">{articleDetail.introduction || (articleDetail.bodySectionHints && articleDetail.bodySectionHints.length > 0) ? 'Main Article Content' : 'Article Body'}</h4>
                <p className="text-foreground whitespace-pre-line leading-relaxed">{articleDetail.fullArticleText}</p>
            </div>
        );
    } else if (!articleDetail.introduction && articleDetail.summary && !articleDetail.conclusion) { 
        contentElements.push(
             <div key="summary-section" className="mb-4">
                <h4 className="text-lg font-semibold text-primary mb-2">Summary</h4>
                <p className="text-foreground whitespace-pre-line leading-relaxed">{articleDetail.summary}</p>
            </div>
        )
    }

    if (articleDetail.conclusion) {
        contentElements.push(
            <div key="conclusion-section" className="mb-4">
                { (articleDetail.introduction || articleDetail.fullArticleText || articleDetail.summary) && <Separator className="my-4" />}
                <h4 className="text-lg font-semibold text-primary mb-2">Conclusion</h4>
                <p className="text-foreground whitespace-pre-line leading-relaxed">{articleDetail.conclusion}</p>
            </div>
        );
    }
    return contentElements.length > 0 ? contentElements : <p className="text-muted-foreground">No primary textual content could be displayed for this item.</p>;
  };


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl bg-card">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center">
            <BookOpen className="mr-3 h-7 w-7 text-primary" />
            {articleDetail?.title || "Full Article"}
          </DialogTitle>
          {articleDetail?.source && articleDetail?.date && (
            <DialogDescription>
              Source: {articleDetail.source} | Date: {articleDetail.date}
              {articleDetail.type === "ai-generated" && " (AI Generated)"}
              {articleDetail.type === "ai-archived" && " (Saved AI Article)"}
               {articleDetail.type === "static-archived" && " (Archived)"}
            </DialogDescription>
          )}
        </DialogHeader>

        {articleDetail?.uploadedImageDataUri || articleDetail?.imageUrl ? (
            <div className="relative w-full h-60 mb-4 mt-2 rounded-md overflow-hidden border bg-muted">
                <Image
                    src={articleDetail.uploadedImageDataUri || articleDetail.imageUrl || "https://placehold.co/600x400.png"}
                    alt={articleDetail.title || "Article image"}
                    fill
                    style={{ objectFit: 'cover' }}
                    data-ai-hint={articleDetail.imageHint || "article image"}
                    onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/600x400.png";}}
                />
            </div>
        ) : null}


        <ScrollArea className="h-[50vh] max-h-[600px] p-1 pr-3 my-2 border rounded-md bg-background shadow-inner">
          {articleDetail ? (
            <div className="p-4 space-y-4">
              {renderArticleBody()}
            </div>
          ) : (
            <Alert variant="default" className="m-4">
              <AlertTriangle className="h-5 w-5" />
              <AlertTitle>No Article Loaded</AlertTitle>
              <AlertDescription>Article details could not be loaded.</AlertDescription>
            </Alert>
          )}
        </ScrollArea>

        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Close
          </Button>
          {articleDetail && articleDetail.type === "ai-generated" && (
            <Button 
                onClick={handleSave} 
                disabled={isSaving || (!articleDetail?.fullArticleText && !articleDetail?.introduction && !articleDetail.summary)} 
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save to Archive
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
