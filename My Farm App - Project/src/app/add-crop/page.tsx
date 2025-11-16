
"use client"; // Add this for useSearchParams

import { AddCropForm } from "@/components/custom/add-crop-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from 'next/navigation';
import type { RegionName } from "@/lib/crop-data";

export default function AddCropPage() {
  const searchParams = useSearchParams();
  const initialRegion = searchParams.get('region') as RegionName | undefined;

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="outline" asChild className="mb-4">
        <Link href="/">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Calendar
        </Link>
      </Button>
      <AddCropForm initialRegion={initialRegion} />
    </div>
  );
}
