
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Newspaper } from "lucide-react";
import Link from "next/link";
import { FarmingArticles } from "@/components/custom/farming-articles"; // Import the component

export default function ArticlesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="outline" asChild className="mb-6">
        <Link href="/">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Calendar
        </Link>
      </Button>
      <Card className="w-full mx-auto shadow-xl">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <Newspaper className="h-8 w-8 text-primary" />
            <CardTitle className="text-3xl">AI-Powered Farming Articles</CardTitle>
          </div>
          <CardDescription>
            Generate, browse, and archive informative farming articles for Uganda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FarmingArticles />
        </CardContent>
      </Card>
    </div>
  );
}
