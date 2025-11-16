
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RegionName } from "@/lib/crop-data";
import { Map as MapIcon } from "lucide-react"; 
import React from "react";

interface RegionMapProps {
  selectedRegionName?: RegionName; 
  // selectedCountryName prop removed
}

export function RegionMap({ selectedRegionName }: RegionMapProps) {
  const countryName = "Uganda"; // Hardcoded country
  const queryLocation = selectedRegionName 
    ? `${selectedRegionName} Region, ${countryName}`
    : countryName;
  
  const mapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(queryLocation)}&t=&z=${selectedRegionName ? 7 : 5}&ie=UTF8&iwloc=&output=embed`;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <MapIcon className="h-6 w-6 text-primary" />
          <CardTitle>{countryName} Agricultural Map</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-muted-foreground">
          Map highlighting {selectedRegionName 
            ? <><span className="font-semibold text-primary">{selectedRegionName}</span> region of </>
            : ''} 
          <span className="font-semibold text-primary">{countryName}</span>.
        </p>
        <div className="aspect-video bg-muted rounded-md overflow-hidden border">
          <iframe
            src={mapUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen={false}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={`Map of ${queryLocation}`}
            aria-label={`Map of ${queryLocation}`}
          ></iframe>
        </div>
      </CardContent>
    </Card>
  );
}
