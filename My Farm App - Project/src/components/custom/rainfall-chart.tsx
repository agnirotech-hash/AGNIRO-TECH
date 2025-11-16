
"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Legend, Tooltip as RechartsTooltip, Line, ReferenceLine } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from "@/components/ui/chart";
import type { RegionName, DailyDataPoint, RainfallDataPoint } from "@/lib/crop-data";
import { UGANDA_RAINFALL_DATA, UGANDA_REGIONS, UGANDA_DAILY_RAINFALL_SIMULATED, ALL_MONTHS } from "@/lib/crop-data";
import { Droplets, Info, Thermometer, CalendarDays, MapPin } from "lucide-react";
import React, { useMemo, useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface RainfallChartProps {
  selectedRegionName: RegionName | "Average";
}

export function RainfallChart({ selectedRegionName }: RainfallChartProps) {
  const [currentMonthName, setCurrentMonthName] = useState<string | null>(null);
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const [lastYear, setLastYear] = useState<number | null>(null);
  const [currentDayOfMonth, setCurrentDayOfMonth] = useState<number | null>(null);

  const [selectedDailyChartRegion, setSelectedDailyChartRegion] = useState<RegionName | "Average">(selectedRegionName);

  useEffect(() => {
    setSelectedDailyChartRegion(selectedRegionName);
  }, [selectedRegionName]);

  useEffect(() => {
    const date = new Date();
    setCurrentMonthName(ALL_MONTHS[date.getMonth()]);
    setCurrentYear(date.getFullYear());
    setLastYear(date.getFullYear() - 1);
    setCurrentDayOfMonth(date.getDate());
  }, []);

  const monthlyChartConfig = useMemo(() => {
    const config: ChartConfig = {
      rainfall: {
        label: "Rainfall (mm)",
      },
      Average: {
        label: "Average",
        color: "hsl(var(--primary))",
      }
    };
    UGANDA_REGIONS.forEach(region => {
      const colorVar = region.accentVar ? `${region.accentVar}-fg` : '--muted-foreground';
      config[region.name] = {
        label: region.name,
        color: `hsl(var(${colorVar}))`,
      };
    });
    return config;
  }, []);

  const monthlyDataKey = selectedRegionName;
  const monthlyChartData = UGANDA_RAINFALL_DATA.map(d => ({
    month: d.month,
    [monthlyDataKey]: d[monthlyDataKey as keyof RainfallDataPoint] !== undefined ? d[monthlyDataKey as keyof RainfallDataPoint] : d.Average
  }));
  const currentMonthlyDisplayConfig = monthlyChartConfig[monthlyDataKey] || monthlyChartConfig.Average;

  const dailyChartData = useMemo(() => {
    if (!currentMonthName) return [];
    const dailySimulatedDataForMonth = UGANDA_DAILY_RAINFALL_SIMULATED[currentMonthName];
    if (!dailySimulatedDataForMonth) return [];

    const regionalDailyData = dailySimulatedDataForMonth[selectedDailyChartRegion] || dailySimulatedDataForMonth["Average"];
    if (!regionalDailyData) return [];

    return regionalDailyData.map(d => ({
      day: d.day,
      rainfallCurrentYear: d.rainfallCurrentYear,
      rainfallLastYear: d.rainfallLastYear,
      temperatureCurrentYear: d.temperatureCurrentYear,
      temperatureLastYear: d.temperatureLastYear,
    }));
  }, [currentMonthName, selectedDailyChartRegion]);

  const dailyChartConfig = useMemo((): ChartConfig => {
    return {
      rainfallCurrentYear: {
        label: `Rain ${currentYear} (mm)`,
        color: "hsl(var(--chart-1))",
      },
      rainfallLastYear: {
        label: `Rain ${lastYear} (mm)`,
        color: "hsl(var(--chart-3))",
      },
      temperatureCurrentYear: {
        label: `Avg Temp ${currentYear} (°C)`,
        color: "hsl(var(--chart-2))",
      },
      temperatureLastYear: {
        label: `Avg Temp ${lastYear} (°C)`,
        color: "hsl(var(--chart-4))",
      },
      today: { 
        label: "Today",
        color: "hsl(var(--accent))",
      }
    };
  }, [currentYear, lastYear]);


  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Droplets className="h-6 w-6 text-primary" />
            <CardTitle>Monthly Rainfall Patterns (Uganda)</CardTitle>
          </div>
          <CardDescription>
            Average monthly rainfall (mm) for {selectedRegionName === "Average" ? "Uganda (national average)" : `the ${selectedRegionName} region`}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{ [monthlyDataKey]: currentMonthlyDisplayConfig, ...monthlyChartConfig }}
            className="min-h-[300px] w-full"
          >
            <BarChart accessibilityLayer data={monthlyChartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => value.slice(0, 3)}
              />
              <YAxis
                label={{ value: 'Rainfall (mm)', angle: -90, position: 'insideLeft', offset: 10 }}
                tickMargin={5}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Legend content={<ChartLegendContent />} />
              <Bar dataKey={monthlyDataKey} fill={currentMonthlyDisplayConfig.color} radius={[4,4,0,0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {currentMonthName && (
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-2">
                <CalendarDays className="h-6 w-6 text-accent" />
                <CardTitle>Daily Weather: {currentMonthName} ({selectedDailyChartRegion})</CardTitle>
              </div>
              <div className="w-full sm:w-auto sm:min-w-[200px]">
                <Label htmlFor="daily-region-select" className="text-xs text-muted-foreground mb-1">View Region:</Label>
                <Select 
                  value={selectedDailyChartRegion} 
                  onValueChange={(value) => setSelectedDailyChartRegion(value as RegionName | "Average")}
                >
                  <SelectTrigger id="daily-region-select" className="h-9">
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Average">Average (Uganda)</SelectItem>
                    {UGANDA_REGIONS.map(region => (
                      <SelectItem key={region.name} value={region.name}>
                        {region.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <CardDescription className="mt-2">
              Simulated daily rainfall (mm) for {currentYear} vs. {lastYear}, and average daily temperatures (°C) for {currentYear} vs. {lastYear}
              {' '}for the {selectedDailyChartRegion === "Average" ? "Uganda (average)" : selectedDailyChartRegion} area. Today is day {currentDayOfMonth}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dailyChartData.length > 0 ? (
              <ChartContainer config={dailyChartConfig} className="min-h-[350px] w-full">
                <BarChart
                  accessibilityLayer
                  data={dailyChartData}
                  margin={{ top: 5, right: 30, bottom: 5, left: 0 }}
                  barGap={2} 
                  barCategoryGap="20%"
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => `${value}`}
                  />
                  <YAxis
                    yAxisId="left"
                    orientation="left"
                    stroke={dailyChartConfig.rainfallCurrentYear.color}
                    label={{ value: 'Rainfall (mm)', angle: -90, position: 'insideLeft', offset: 10, fill: dailyChartConfig.rainfallCurrentYear.color}}
                    tickMargin={5}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke={dailyChartConfig.temperatureCurrentYear.color}
                    label={{ value: 'Avg Temp (°C)', angle: -90, position: 'insideRight', offset: 10, fill: dailyChartConfig.temperatureCurrentYear.color }}
                    tickMargin={5}
                  />
                  <RechartsTooltip
                    cursor={{fill: 'hsl(var(--muted))'}}
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <Legend content={<ChartLegendContent />} />
                  <Bar
                    dataKey="rainfallCurrentYear"
                    yAxisId="left"
                    fill={dailyChartConfig.rainfallCurrentYear.color}
                    radius={[2, 2, 0, 0]}
                    name={`Rain ${currentYear} (mm)`}
                    barSize={8}
                  />
                  <Bar
                    dataKey="rainfallLastYear"
                    yAxisId="left"
                    fill={dailyChartConfig.rainfallLastYear.color}
                    radius={[2, 2, 0, 0]}
                    name={`Rain ${lastYear} (mm)`}
                    barSize={8}
                   />
                  <Line
                    dataKey="temperatureCurrentYear"
                    yAxisId="right"
                    type="monotone"
                    stroke={dailyChartConfig.temperatureCurrentYear.color}
                    strokeWidth={2}
                    dot={false}
                    name={`Avg Temp ${currentYear} (°C)`}
                  />
                  <Line
                    dataKey="temperatureLastYear"
                    yAxisId="right"
                    type="monotone"
                    stroke={dailyChartConfig.temperatureLastYear.color}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    name={`Avg Temp ${lastYear} (°C)`}
                  />
                  {currentDayOfMonth && (
                     <ReferenceLine
                        x={currentDayOfMonth}
                        stroke={dailyChartConfig.today.color}
                        strokeDasharray="3 3"
                        yAxisId="left" 
                      >
                        <RechartsTooltip content={() => <div className="bg-accent text-accent-foreground p-1 rounded-sm text-xs">Today</div> }/>
                      </ReferenceLine>
                  )}
                </BarChart>
              </ChartContainer>
            ) : (
              <Alert variant="default">
                <Info className="h-4 w-4" />
                <AlertTitle>No Daily Data Available</AlertTitle>
                <AlertDescription>
                  Simulated daily data is not available for {currentMonthName} in the {selectedDailyChartRegion} area for this demonstration.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <p className="text-xs text-muted-foreground">
              Note: Daily rainfall and temperature data is simulated for demonstration purposes.
            </p>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}

