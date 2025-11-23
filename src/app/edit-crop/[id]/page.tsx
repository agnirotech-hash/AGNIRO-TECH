
"use client";

import { useParams, useRouter } from "next/navigation";
import { useCropData } from "@/context/crop-data-context";
import { EditCropForm } from "@/components/custom/edit-crop-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function EditCropPage() {
  const params = useParams();
  const router = useRouter();
  const { crops } = useCropData();
  const cropId = typeof params.id === 'string' ? params.id : undefined;

  const cropToEdit = cropId ? crops.find((crop) => crop.id === cropId) : undefined;

  if (!cropToEdit) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Crop Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>The crop you are trying to edit does not exist or could not be found.</CardDescription>
            <Button onClick={() => router.push("/")} className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Go Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="outline" asChild className="mb-4">
        <Link href="/">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Calendar
        </Link>
      </Button>
      <EditCropForm initialCropData={cropToEdit} />
    </div>
  );
}
