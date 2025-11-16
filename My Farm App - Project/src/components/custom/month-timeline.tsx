"use client";

import { ALL_MONTHS } from "@/lib/crop-data";
import { cn } from "@/lib/utils";

interface MonthTimelineProps {
  plantingMonths: string[];
  harvestMonths: string[];
  regionAccentVar?: string; // e.g., "--northern-accent-bg"
}

const getRegionColor = (variableName: string, fallback: string) => {
  if (typeof window !== 'undefined') {
    const value = getComputedStyle(document.documentElement).getPropertyValue(variableName.replace('-fg', '-bg'));
    if (value) return `hsl(${value.trim()})`;
  }
  return fallback;
};


export function MonthTimeline({ plantingMonths, harvestMonths, regionAccentVar }: MonthTimelineProps) {
  const plantingColor = regionAccentVar ? `hsl(var(${regionAccentVar}-fg))` : 'hsl(var(--primary))';
  const harvestColor = regionAccentVar ? `hsl(var(${regionAccentVar}-bg))` : 'hsl(var(--secondary))';
  const baseCellBg = regionAccentVar ? `hsl(var(${regionAccentVar}-bg) / 0.1)` : 'hsl(var(--muted) / 0.3)';

  return (
    <div className="mt-2">
      <div className="grid grid-cols-12 gap-0.5 text-xs text-center">
        {ALL_MONTHS.map((month) => (
          <div key={`${month}-header`} className="pb-1 font-medium text-muted-foreground">
            {month.charAt(0)}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-12 gap-0.5">
        {ALL_MONTHS.map((month) => {
          const isPlanting = plantingMonths.includes(month);
          const isHarvesting = harvestMonths.includes(month);
          
          let bgColor = baseCellBg;
          let textColor = 'hsl(var(--foreground))';
          let borderColor = 'transparent';

          if (isPlanting && isHarvesting) {
            // Could use a gradient or pattern, for now, prioritize planting or use a mixed color
            bgColor = `repeating-linear-gradient(45deg, ${plantingColor}, ${plantingColor} 5px, ${harvestColor} 5px, ${harvestColor} 10px)`;
            borderColor = plantingColor;
          } else if (isPlanting) {
            bgColor = plantingColor;
            textColor = 'hsl(var(--primary-foreground))';
            borderColor = plantingColor;
          } else if (isHarvesting) {
            bgColor = harvestColor;
            textColor = regionAccentVar ? `hsl(var(${regionAccentVar}-fg))` : 'hsl(var(--secondary-foreground))';
            borderColor = harvestColor;
          }

          return (
            <div
              key={month}
              title={`${month}${isPlanting ? " (Planting)" : ""}${isHarvesting ? " (Harvest)" : ""}`}
              className={cn(
                "h-6 w-full rounded-sm flex items-center justify-center border",
                "transition-all duration-150 ease-in-out"
              )}
              style={{ 
                backgroundColor: bgColor, 
                color: textColor,
                borderColor: borderColor,
              }}
              aria-label={`${month}: ${isPlanting ? "Planting" : ""} ${isHarvesting ? "Harvest" : ""}`.trim()}
            >
              {/* Optionally show month letter again or an icon */}
            </div>
          );
        })}
      </div>
       <div className="mt-2 flex items-center space-x-4 text-xs">
        <div className="flex items-center space-x-1">
          <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: plantingColor }} />
          <span>Planting</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: harvestColor }} />
          <span>Harvest</span>
        </div>
      </div>
    </div>
  );
}
