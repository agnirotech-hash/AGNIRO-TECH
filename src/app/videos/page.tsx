
"use client";

import React, { useState, useEffect, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { ArrowLeft, Youtube, Trash2, UploadCloud, PlusCircle, ExternalLink } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

interface VideoItem {
  id: string;
  title: string;
  youtubeUrl: string;
  source?: string;
  description?: string;
  thumbnailHint?: string;
  uploadedThumbnailDataUri?: string; // Session-only custom thumbnail
}

const LOCAL_STORAGE_VIDEOS_KEY = "agniro_userVideoLinks";

export default function VideosPage() {
  const [videoLinks, setVideoLinks] = useState<VideoItem[]>([]);
  const [newVideoTitle, setNewVideoTitle] = useState("");
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [newVideoSource, setNewVideoSource] = useState("");
  const [newVideoDescription, setNewVideoDescription] = useState("");
  const [newVideoThumbnailHint, setNewVideoThumbnailHint] = useState("");

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<VideoItem | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Load videos from localStorage when the component mounts
    if (typeof window !== 'undefined') {
      const storedVideos = localStorage.getItem(LOCAL_STORAGE_VIDEOS_KEY);
      if (storedVideos) {
        try {
          setVideoLinks(JSON.parse(storedVideos));
        } catch (e) {
          console.error("Error parsing video links from localStorage:", e);
          localStorage.removeItem(LOCAL_STORAGE_VIDEOS_KEY); // Clear corrupted data
        }
      }
    }
  }, []);

  useEffect(() => {
    // Save videos to localStorage whenever the videoLinks state changes
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_VIDEOS_KEY, JSON.stringify(videoLinks));
    }
  }, [videoLinks]);

  const getYouTubeEmbedUrl = (url: string): string | null => {
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(youtubeRegex);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };
  
  const getYouTubeThumbnailUrl = (url: string): string | null => {
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(youtubeRegex);
    return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : null;
  }

  const handleAddYouTubeLink = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newVideoTitle.trim() || !newVideoUrl.trim()) {
      toast({ variant: "destructive", title: "Missing Information", description: "Title and YouTube URL are required." });
      return;
    }
    const embedUrl = getYouTubeEmbedUrl(newVideoUrl);
    if (!embedUrl) {
      toast({ variant: "destructive", title: "Invalid YouTube URL", description: "Please enter a valid YouTube video URL." });
      return;
    }

    const newVideo: VideoItem = {
      id: `video-${Date.now()}`,
      title: newVideoTitle,
      youtubeUrl: newVideoUrl, // Store original URL for linking
      source: newVideoSource,
      description: newVideoDescription,
      thumbnailHint: newVideoThumbnailHint || "video play",
    };
    setVideoLinks(prev => [newVideo, ...prev]);
    setNewVideoTitle("");
    setNewVideoUrl("");
    setNewVideoSource("");
    setNewVideoDescription("");
    setNewVideoThumbnailHint("");
    toast({ title: "Video Link Added", description: `"${newVideo.title}" has been added.` });
  };

  const handleOpenDeleteDialog = (video: VideoItem) => {
    setVideoToDelete(video);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (videoToDelete) {
      setVideoLinks(prev => prev.filter(v => v.id !== videoToDelete.id));
      toast({ title: "Video Link Deleted", description: `"${videoToDelete.title}" has been removed.` });
    }
    setVideoToDelete(null);
    setIsDeleteDialogOpen(false);
  };

  const handleThumbnailUpload = (event: React.ChangeEvent<HTMLInputElement>, videoId: string) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageDataUri = reader.result as string;
        setVideoLinks(prevLinks => prevLinks.map(v =>
          v.id === videoId ? { ...v, uploadedThumbnailDataUri: imageDataUri } : v
        ));
        toast({ title: "Thumbnail Updated", description: "Custom thumbnail applied for this session." });
      };
      reader.onerror = () => {
        toast({ variant: "destructive", title: "Image Upload Error", description: "Could not read image file." });
      };
      reader.readAsDataURL(file);
    } else if (file) {
      toast({ variant: "destructive", title: "Invalid File Type", description: "Please select an image file." });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <Button variant="outline" asChild className="mb-6">
        <Link href="/">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Calendar
        </Link>
      </Button>

      <Card className="shadow-xl">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <Youtube className="h-8 w-8 text-destructive" />
            <CardTitle className="text-3xl">Manage Farming Videos</CardTitle>
          </div>
          <CardDescription>
            Add YouTube video links to create a library of helpful farming tutorials and vlogs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddYouTubeLink} className="space-y-4 p-4 border rounded-lg bg-background shadow">
            <h3 className="text-lg font-semibold text-primary">Add New YouTube Video Link</h3>
            <div>
              <Label htmlFor="videoTitle">Video Title</Label>
              <Input id="videoTitle" value={newVideoTitle} onChange={e => setNewVideoTitle(e.target.value)} placeholder="e.g., Best Composting Techniques" required />
            </div>
            <div>
              <Label htmlFor="videoUrl">YouTube Video URL</Label>
              <Input id="videoUrl" type="url" value={newVideoUrl} onChange={e => setNewVideoUrl(e.target.value)} placeholder="e.g., https://www.youtube.com/watch?v=abcdef12345" required />
            </div>
            <div>
              <Label htmlFor="videoSource">Source / Channel Name (Optional)</Label>
              <Input id="videoSource" value={newVideoSource} onChange={e => setNewVideoSource(e.target.value)} placeholder="e.g., YouTube - AgriChannel" />
            </div>
            <div>
              <Label htmlFor="videoDescription">Short Description (Optional)</Label>
              <Textarea id="videoDescription" value={newVideoDescription} onChange={e => setNewVideoDescription(e.target.value)} placeholder="A brief summary of the video content." />
            </div>
             <div>
              <Label htmlFor="videoThumbnailHint">Thumbnail Hint (Optional)</Label>
              <Input id="videoThumbnailHint" value={newVideoThumbnailHint} onChange={e => setNewVideoThumbnailHint(e.target.value)} placeholder="e.g., farmer watering, compost pile" />
            </div>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <PlusCircle className="mr-2 h-5 w-5" /> Add Video Link
            </Button>
          </form>
        </CardContent>
      </Card>

      <Separator />

      <div>
        <h2 className="text-2xl font-semibold text-primary mb-4">Video Library</h2>
        {videoLinks.length === 0 ? (
          <Card className="bg-card/50 border-dashed">
            <CardContent className="p-6 text-center text-muted-foreground">
              <p>No videos added yet. Use the form above to add YouTube video links.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videoLinks.map(video => {
              const embedUrl = getYouTubeEmbedUrl(video.youtubeUrl);
              const defaultThumbnailUrl = getYouTubeThumbnailUrl(video.youtubeUrl);
              const imageInputId = `upload-thumb-${video.id}`;
              return (
                <Card key={video.id} className="flex flex-col shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader>
                    <div className="relative w-full aspect-video bg-muted rounded-md overflow-hidden mb-2 border">
                       <Image
                        src={video.uploadedThumbnailDataUri || defaultThumbnailUrl || `https://placehold.co/320x180.png?text=${encodeURIComponent(video.title)}`}
                        alt={video.title}
                        fill
                        style={{ objectFit: 'cover' }}
                        data-ai-hint={video.thumbnailHint || "video play"}
                        onError={(e) => { (e.target as HTMLImageElement).src = `https://placehold.co/320x180.png?text=${encodeURIComponent(video.title)}`;}}
                      />
                    </div>
                     <Label htmlFor={imageInputId} className="text-xs text-primary hover:underline cursor-pointer flex items-center gap-1 mt-1">
                        <UploadCloud className="h-3 w-3" /> Change Thumbnail (Session)
                    </Label>
                    <Input
                        id={imageInputId}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleThumbnailUpload(e, video.id)}
                    />
                    <CardTitle className="text-lg mt-2">{video.title}</CardTitle>
                    {video.source && <CardDescription className="text-xs">{video.source}</CardDescription>}
                  </CardHeader>
                  <CardContent className="flex-grow">
                    {video.description && <p className="text-sm text-muted-foreground line-clamp-3">{video.description}</p>}
                    {embedUrl && (
                      <div className="mt-3 aspect-video rounded-md overflow-hidden border">
                        <iframe
                          src={embedUrl}
                          title={video.title}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="w-full h-full"
                        ></iframe>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-between items-center pt-2">
                    <Button variant="outline" size="sm" asChild>
                        <a href={video.youtubeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center">
                           <ExternalLink className="mr-2 h-4 w-4" /> Watch on YouTube
                        </a>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDeleteDialog(video)} aria-label={`Delete video: ${video.title}`}>
                      <Trash2 className="h-4 w-4 text-destructive hover:text-destructive/70" />
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete the video link "{videoToDelete?.title || 'this video'}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
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
