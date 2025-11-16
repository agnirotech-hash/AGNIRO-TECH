
import type { LucideIcon } from 'lucide-react';

export type CropType = "Traditional" | "Modern";
export type RegionName = "Northern" | "Central" | "Eastern" | "Western";

export interface Crop {
  id: string;
  name: string;
  region: RegionName;
  plantingMonths: string[];
  weedingInfo: string;
  harvestMonths: string[];
  type: CropType;
  notes: string;
  iconHint?: string;
  uploadedImageDataUri?: string;
  datePlanted?: string; // ISO date string
}

export interface Region {
  name: RegionName;
  accentVar: string;
}

export interface RainfallDataPoint {
  month: string;
  Northern: number;
  Central: number;
  Eastern: number;
  Western: number;
  Average: number;
}

// Updated DailyDataPoint interface
export interface DailyDataPoint {
  day: number;
  rainfallCurrentYear: number;
  rainfallLastYear: number;
  temperatureCurrentYear: number;
  temperatureLastYear: number; 
}

export interface SimulatedDailyRainfall {
  [month: string]: {
    [regionOrAverage: string]: DailyDataPoint[];
  };
}

export const ALL_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_MAP: { [key: string]: number } = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

export function parseMonthString(monthStr: string | undefined | null): string[] {
  if (!monthStr || typeof monthStr !== 'string') return [];
  const cleanedMonthStr = monthStr.toLowerCase().trim();
  if (cleanedMonthStr === "" || cleanedMonthStr === "n/a" || cleanedMonthStr === "minimal" || cleanedMonthStr.includes("not apply")) {
    return [];
  }
  if (cleanedMonthStr.includes("year-round") || cleanedMonthStr.includes("any time") || cleanedMonthStr.includes("continuous")) {
    return [...ALL_MONTHS];
  }
  const uniqueMonths = new Set<string>();
  const normalizedStr = cleanedMonthStr.replace(/;/g, ',').replace(/\s*&\s*/g, ',');
  const parts = normalizedStr.split(',').map(p => p.trim().replace(/\s*\(\d+(st|nd|rd|th)\s*(season)?\s*\)/gi, '').trim());
  parts.forEach(part => {
    if (part.includes('–') || part.includes('-')) {
      const [startStr, endStr] = part.split(/–|-/).map(m => m.trim());
      const startMonthIndex = ALL_MONTHS.findIndex(m => m.toLowerCase() === startStr.substring(0,3));
      const endMonthIndex = ALL_MONTHS.findIndex(m => m.toLowerCase() === endStr.substring(0,3));
      if (startMonthIndex !== -1 && endMonthIndex !== -1) {
        if (startMonthIndex <= endMonthIndex) {
          for (let i = startMonthIndex; i <= endMonthIndex; i++) {
            uniqueMonths.add(ALL_MONTHS[i]);
          }
        } else {
          for (let i = startMonthIndex; i < ALL_MONTHS.length; i++) {
            uniqueMonths.add(ALL_MONTHS[i]);
          }
          for (let i = 0; i <= endMonthIndex; i++) {
            uniqueMonths.add(ALL_MONTHS[i]);
          }
        }
      }
    } else {
      const monthIndex = ALL_MONTHS.findIndex(m => m.toLowerCase() === part.substring(0,3));
      if (monthIndex !== -1) {
        uniqueMonths.add(ALL_MONTHS[monthIndex]);
      }
    }
  });
  return Array.from(uniqueMonths).sort((a, b) => MONTH_MAP[a] - MONTH_MAP[b]);
}

export const UGANDA_REGIONS: Region[] = [
  { name: "Northern", accentVar: "--northern-accent" },
  { name: "Central", accentVar: "--central-accent" },
  { name: "Eastern", accentVar: "--eastern-accent" },
  { name: "Western", accentVar: "--western-accent" },
];

export const UGANDA_INITIAL_CROPS: Crop[] = [
  {
    id: "ug-northern-maize-1", name: "Maize (Early)", region: "Northern",
    plantingMonths: parseMonthString("Mar–Apr"), weedingInfo: "3–5 wks after planting", harvestMonths: parseMonthString("Jul–Aug"),
    type: "Traditional", notes: "First season maize, rain-dependent.", iconHint: "corn field", datePlanted: undefined
  },
  {
    id: "ug-northern-sorghum-1", name: "Sorghum", region: "Northern",
    plantingMonths: parseMonthString("Mar-Apr"), weedingInfo: "Critical in early stages", harvestMonths: parseMonthString("Jul-Aug"),
    type: "Traditional", notes: "Drought-tolerant staple.", iconHint: "sorghum plant", datePlanted: undefined
  },
  {
    id: "ug-northern-beans-1", name: "Beans (Bush)", region: "Northern",
    plantingMonths: parseMonthString("Mar-Apr, Aug-Sep"), weedingInfo: "2-3 weedings", harvestMonths: parseMonthString("Jun-Jul, Nov-Dec"),
    type: "Traditional", notes: "Important protein source.", iconHint: "bean pod", datePlanted: undefined
  },
  {
    id: "ug-northern-simsim-1", name: "Simsim (Sesame)", region: "Northern",
    plantingMonths: parseMonthString("Apr-May"), weedingInfo: "Keep weed free for first 4-6 weeks", harvestMonths: parseMonthString("Aug-Sep"),
    type: "Traditional", notes: "Oilseed crop, popular in Lira and Gulu.", iconHint: "sesame plant", datePlanted: undefined
  },
  {
    id: "ug-northern-cassava-1", name: "Cassava", region: "Northern",
    plantingMonths: parseMonthString("Mar-May"), weedingInfo: "Weed regularly until canopy closes", harvestMonths: parseMonthString("9-12 months after planting"),
    type: "Traditional", notes: "Drought-resistant, key food security crop.", iconHint: "cassava root", datePlanted: undefined
  },
  {
    id: "ug-northern-cowpeas-1", name: "Cowpeas", region: "Northern",
    plantingMonths: parseMonthString("Apr-May, Aug-Sep"), weedingInfo: "2-3 weedings, especially early", harvestMonths: parseMonthString("Jul-Aug, Nov-Dec (leaves/pods)"),
    type: "Traditional", notes: "Dual purpose (leaves and grains).", iconHint: "cowpea plant", datePlanted: undefined
  },
   {
    id: "ug-northern-groundnuts-1", name: "Groundnuts", region: "Northern",
    plantingMonths: parseMonthString("Apr-May"), weedingInfo: "Critical weeding 2-4 weeks after germination.", harvestMonths: parseMonthString("Aug-Sep"),
    type: "Traditional", notes: "Important legume for food and oil.", iconHint: "peanut plant", datePlanted: undefined
  },
  {
    id: "ug-northern-millet-1", name: "Finger Millet", region: "Northern",
    plantingMonths: parseMonthString("Apr-May"), weedingInfo: "Early weeding essential for good establishment.", harvestMonths: parseMonthString("Aug-Sep"),
    type: "Traditional", notes: "Nutritious cereal, often used for porridge and local brew.", iconHint: "millet head", datePlanted: undefined
  },
  {
    id: "ug-northern-pigeon-peas-1", name: "Pigeon Peas", region: "Northern",
    plantingMonths: parseMonthString("Mar-Apr"), weedingInfo: "Keep weed-free during early growth.", harvestMonths: parseMonthString("Jul-Aug (green), Oct-Nov (dry)"),
    type: "Traditional", notes: "Hardy legume, improves soil fertility.", iconHint: "pigeon pea", datePlanted: undefined
  },
  {
    id: "ug-northern-sunflower-1", name: "Sunflower", region: "Northern",
    plantingMonths: parseMonthString("Apr-May"), weedingInfo: "Control weeds especially in the first 45 days.", harvestMonths: parseMonthString("Aug-Sep"),
    type: "Modern", notes: "Cash crop for oil production, increasingly popular.", iconHint: "sunflower head", datePlanted: undefined
  },
  {
    id: "ug-central-matoke-1", name: "Matoke (Banana)", region: "Central",
    plantingMonths: parseMonthString("Year-round (best Feb–May)"), weedingInfo: "Minimal (perennial), ring weed", harvestMonths: parseMonthString("Year-round (bunches)"),
    type: "Traditional", notes: "Perennial staple; tolerant of high rainfall.", iconHint: "banana tree", datePlanted: undefined
  },
  {
    id: "ug-central-robusta-coffee-1", name: "Robusta Coffee", region: "Central",
    plantingMonths: parseMonthString("Feb–Mar (seedlings)"), weedingInfo: "Weeding/hoeing around trees", harvestMonths: parseMonthString("Oct–Feb & Mar–Jun (flushes)"),
    type: "Modern", notes: "Major export cash crop; requires reliable rains.", iconHint: "coffee plant", datePlanted: undefined
  },
  {
    id: "ug-central-sweet-potato-1", name: "Sweet Potatoes", region: "Central",
    plantingMonths: parseMonthString("Mar-May, Sep-Nov"), weedingInfo: "Keep weed-free first 2 months", harvestMonths: parseMonthString("3-4 months after planting"),
    type: "Traditional", notes: "Important food security crop.", iconHint: "sweet potato", datePlanted: undefined
  },
  {
    id: "ug-central-vanilla-1", name: "Vanilla", region: "Central",
    plantingMonths: parseMonthString("Mar-Apr (cuttings)"), weedingInfo: "Regular weeding and mulching", harvestMonths: parseMonthString("Jun-Jul (main), Dec-Jan (fly crop)"),
    type: "Modern", notes: "High-value export, labor-intensive.", iconHint: "vanilla bean", datePlanted: undefined
  },
  {
    id: "ug-central-pineapple-1", name: "Pineapple", region: "Central",
    plantingMonths: parseMonthString("Mar-May, Aug-Oct"), weedingInfo: "Consistent weeding, especially when young", harvestMonths: parseMonthString("12-18 months after planting"),
    type: "Modern", notes: "Popular fruit crop for local and export markets.", iconHint: "pineapple fruit", datePlanted: undefined
  },
  {
    id: "ug-central-passion-fruit-1", name: "Passion Fruit", region: "Central",
    plantingMonths: parseMonthString("Mar-Apr, Sep-Oct (seedlings)"), weedingInfo: "Regular weeding and training on trellises", harvestMonths: parseMonthString("6-9 months after planting, continuous"),
    type: "Modern", notes: "Fast-growing vine, popular fruit.", iconHint: "passion fruit", datePlanted: undefined
  },
  {
    id: "ug-central-maize-2", name: "Maize (Hybrid)", region: "Central",
    plantingMonths: parseMonthString("Mar-Apr, Aug-Sep"), weedingInfo: "Weed control critical in first 6 weeks.", harvestMonths: parseMonthString("Jun-Jul, Nov-Dec"),
    type: "Modern", notes: "Widely grown for food and animal feed.", iconHint: "corn cob", datePlanted: undefined
  },
  {
    id: "ug-central-beans-2", name: "Beans (Climbing)", region: "Central",
    plantingMonths: parseMonthString("Mar-Apr, Sep-Oct"), weedingInfo: "Requires staking and regular weeding.", harvestMonths: parseMonthString("Jun-Jul, Dec-Jan"),
    type: "Modern", notes: "Higher yields than bush beans, needs support.", iconHint: "bean vine", datePlanted: undefined
  },
  {
    id: "ug-central-yams-1", name: "Yams", region: "Central",
    plantingMonths: parseMonthString("Mar-Apr"), weedingInfo: "Keep mounds weed-free.", harvestMonths: parseMonthString("Nov-Jan (8-10 months)"),
    type: "Traditional", notes: "Tuber crop, important for food security.", iconHint: "yam tuber", datePlanted: undefined
  },
  {
    id: "ug-central-ginger-1", name: "Ginger", region: "Central",
    plantingMonths: parseMonthString("Aug-Sep"), weedingInfo: "Mulching helps suppress weeds.", harvestMonths: parseMonthString("May-Jun (8-9 months)"),
    type: "Modern", notes: "Spice crop with good market potential.", iconHint: "ginger root", datePlanted: undefined
  },
  {
    id: "ug-eastern-millet-1", name: "Millet (Finger)", region: "Eastern",
    plantingMonths: parseMonthString("Mar–Apr & Aug–Sep"), weedingInfo: "2–3 wks after planting", harvestMonths: parseMonthString("Jul–Aug (1st); Dec–Jan (2nd)"),
    type: "Traditional", notes: "Drought-hardy; used in semi-arid zones (Karamoja/Teso).", iconHint: "millet plant", datePlanted: undefined
  },
  {
    id: "ug-eastern-groundnuts-1", name: "Groundnuts", region: "Eastern",
    plantingMonths: parseMonthString("Mar-Apr, Aug-Sep"), weedingInfo: "Early weeding is crucial", harvestMonths: parseMonthString("Jun-Jul, Nov-Dec"),
    type: "Traditional", notes: "Popular legume, good for soil fertility.", iconHint: "peanut plant", datePlanted: undefined
  },
  {
    id: "ug-eastern-rice-1", name: "Rice (Upland)", region: "Eastern",
    plantingMonths: parseMonthString("Mar-Apr"), weedingInfo: "Requires intensive weeding", harvestMonths: parseMonthString("Jul-Aug"),
    type: "Modern", notes: "Increasingly popular, rain-fed varieties.", iconHint: "rice paddy", datePlanted: undefined
  },
  {
    id: "ug-eastern-sugarcane-1", name: "Sugarcane", region: "Eastern",
    plantingMonths: parseMonthString("Mar-May (setts)"), weedingInfo: "Regular weeding, especially in early stages", harvestMonths: parseMonthString("12-18 months for plant crop, then ratoon"),
    type: "Modern", notes: "Major commercial crop in Busoga region.", iconHint: "sugar cane", datePlanted: undefined
  },
  {
    id: "ug-eastern-soybeans-1", name: "Soybeans", region: "Eastern",
    plantingMonths: parseMonthString("Mar-Apr, Aug-Sep"), weedingInfo: "Keep weed-free for the first 6-8 weeks", harvestMonths: parseMonthString("Jun-Jul, Nov-Dec"),
    type: "Modern", notes: "Versatile legume, good for food and feed.", iconHint: "soybean plant", datePlanted: undefined
  },
  {
    id: "ug-eastern-cotton-1", name: "Cotton", region: "Eastern",
    plantingMonths: parseMonthString("May-Jun"), weedingInfo: "Multiple weedings required", harvestMonths: parseMonthString("Oct-Dec"),
    type: "Traditional", notes: "Important cash crop, though acreage varies.", iconHint: "cotton boll", datePlanted: undefined
  },
  {
    id: "ug-eastern-sorghum-2", name: "Sorghum (Improved)", region: "Eastern",
    plantingMonths: parseMonthString("Mar-Apr, Aug-Sep"), weedingInfo: "Early weeding critical for yield.", harvestMonths: parseMonthString("Jun-Jul, Nov-Dec"),
    type: "Modern", notes: "Improved varieties for higher yield and brewing.", iconHint: "sorghum head", datePlanted: undefined
  },
  {
    id: "ug-eastern-cassava-2", name: "Cassava (Resistant)", region: "Eastern",
    plantingMonths: parseMonthString("Mar-May"), weedingInfo: "Maintain weed-free until canopy closure.", harvestMonths: parseMonthString("9-12 months after planting"),
    type: "Modern", notes: "Disease-resistant varieties crucial for food security.", iconHint: "cassava leaf", datePlanted: undefined
  },
  {
    id: "ug-eastern-simsim-2", name: "Simsim (Sesame)", region: "Eastern",
    plantingMonths: parseMonthString("Apr-May"), weedingInfo: "Thinning and weeding essential in early stages.", harvestMonths: parseMonthString("Jul-Aug"),
    type: "Traditional", notes: "Oilseed crop, also used in local dishes.", iconHint: "sesame seeds", datePlanted: undefined
  },
  {
    id: "ug-eastern-sunflower-2", name: "Sunflower", region: "Eastern",
    plantingMonths: parseMonthString("Mar-Apr"), weedingInfo: "Control weeds in the first 4-6 weeks.", harvestMonths: parseMonthString("Jul-Aug"),
    type: "Modern", notes: "Cash crop for cooking oil.", iconHint: "sunflower field", datePlanted: undefined
  },
  {
    id: "ug-western-irish-potatoes-1", name: "Irish Potatoes", region: "Western",
    plantingMonths: parseMonthString("Mar-Apr, Sep-Oct"), weedingInfo: "Hilling and weeding", harvestMonths: parseMonthString("Jun-Jul, Dec-Jan"),
    type: "Modern", notes: "Grown in highland areas like Kabale.", iconHint: "potato plant", datePlanted: undefined
  },
  {
    id: "ug-western-arabica-coffee-1", name: "Arabica Coffee", region: "Western",
    plantingMonths: parseMonthString("Feb–Mar (nursery)"), weedingInfo: "Weeding around trees", harvestMonths: parseMonthString("Oct–Dec (main flush)"),
    type: "Modern", notes: "Grown on cool highlands (Kabale, Kasese foothills).", iconHint: "coffee cherry", datePlanted: undefined
  },
  {
    id: "ug-western-tea-1", name: "Tea", region: "Western",
    plantingMonths: parseMonthString("Year-round (cuttings, best during rains)"), weedingInfo: "Regular slashing/uprooting", harvestMonths: parseMonthString("Year-round (plucking)"),
    type: "Modern", notes: "Major cash crop in specific highland areas.", iconHint: "tea leaves", datePlanted: undefined
  },
  {
    id: "ug-western-cabbages-1", name: "Cabbages", region: "Western",
    plantingMonths: parseMonthString("Mar-Apr, Aug-Sep (seedlings)"), weedingInfo: "Keep weed-free, especially when young", harvestMonths: parseMonthString("2-3 months after transplanting"),
    type: "Modern", notes: "Common vegetable in cooler highland areas.", iconHint: "cabbage head", datePlanted: undefined
  },
  {
    id: "ug-western-carrots-1", name: "Carrots", region: "Western",
    plantingMonths: parseMonthString("Mar-Apr, Aug-Sep"), weedingInfo: "Requires fine seedbed, diligent early weeding", harvestMonths: parseMonthString("2-3 months after sowing"),
    type: "Modern", notes: "Popular root vegetable, prefers cooler climates.", iconHint: "carrot root", datePlanted: undefined
  },
  {
    id: "ug-western-onions-1", name: "Onions", region: "Western",
    plantingMonths: parseMonthString("Feb-Mar (nursery), Aug-Sep (nursery)"), weedingInfo: "Critical during bulb formation", harvestMonths: parseMonthString("Jun-Jul, Nov-Dec"),
    type: "Modern", notes: "Widely grown for local consumption and sale.", iconHint: "onion bulb", datePlanted: undefined
  },
  {
    id: "ug-western-beans-3", name: "Beans (Bush - Improved)", region: "Western",
    plantingMonths: parseMonthString("Mar-Apr, Aug-Sep"), weedingInfo: "Two critical weedings usually suffice.", harvestMonths: parseMonthString("Jun-Jul, Nov-Dec"),
    type: "Modern", notes: "Improved varieties for better yield and disease resistance.", iconHint: "bean plant", datePlanted: undefined
  },
  {
    id: "ug-western-wheat-1", name: "Wheat", region: "Western",
    plantingMonths: parseMonthString("Apr-May"), weedingInfo: "Weed control important in early growth stages.", harvestMonths: parseMonthString("Aug-Sep"),
    type: "Modern", notes: "Grown in highland areas like Kapchorwa and Kabale.", iconHint: "wheat grain", datePlanted: undefined
  },
  {
    id: "ug-western-apples-1", name: "Apples (Temperate)", region: "Western",
    plantingMonths: parseMonthString("Jul-Aug (dormant season planting)"), weedingInfo: "Maintain a weed-free circle around young trees.", harvestMonths: parseMonthString("Feb-Apr (depending on variety)"),
    type: "Modern", notes: "Emerging temperate fruit crop in highlands (e.g., Kabale).", iconHint: "apple fruit", datePlanted: undefined
  },
  {
    id: "ug-western-peas-1", name: "Peas (Garden)", region: "Western",
    plantingMonths: parseMonthString("Mar-Apr, Aug-Sep"), weedingInfo: "Support with trellises and weed regularly.", harvestMonths: parseMonthString("May-Jun, Oct-Nov"),
    type: "Modern", notes: "Cool-season vegetable popular in highlands.", iconHint: "pea pod", datePlanted: undefined
  }
];

export const UGANDA_RAINFALL_DATA: RainfallDataPoint[] = [
  { month: "Jan", Northern: 16, Central: 45, Eastern: 40, Western: 80 },
  { month: "Feb", Northern: 30, Central: 65, Eastern: 60, Western: 100 },
  { month: "Mar", Northern: 80, Central: 120, Eastern: 110, Western: 150 },
  { month: "Apr", Northern: 150, Central: 170, Eastern: 160, Western: 180 },
  { month: "May", Northern: 130, Central: 130, Eastern: 120, Western: 140 },
  { month: "Jun", Northern: 100, Central: 90, Eastern: 80, Western: 100 },
  { month: "Jul", Northern: 110, Central: 70, Eastern: 70, Western: 80 },
  { month: "Aug", Northern: 140, Central: 80, Eastern: 90, Western: 100 },
  { month: "Sep", Northern: 100, Central: 110, Eastern: 120, Western: 150 },
  { month: "Oct", Northern: 90, Central: 140, Eastern: 150, Western: 170 },
  { month: "Nov", Northern: 60, Central: 120, Eastern: 110, Western: 150 },
  { month: "Dec", Northern: 25, Central: 70, Eastern: 50, Western: 100 },
].map(data => ({
    ...data,
    Average: Math.round((data.Northern + data.Central + data.Eastern + data.Western) / 4)
}));


// Simulated daily rainfall data for Uganda (Average)
const generateRandomDailyData = (daysInMonth: number, monthlyAverageRainfallCurrentYear: number, monthlyAverageRainfallLastYear: number, regionName: string): DailyDataPoint[] => {
  const dailyData: DailyDataPoint[] = [];
  const averageDailyRainCurrent = monthlyAverageRainfallCurrentYear / daysInMonth;
  const averageDailyRainLast = monthlyAverageRainfallLastYear / daysInMonth;

  let baseTemp = 20; // °C
  if (regionName === "Northern") baseTemp = 22;
  else if (regionName === "Western") baseTemp = 18;
  else if (regionName === "Eastern") baseTemp = 21;
  else if (regionName === "Central") baseTemp = 19;


  for (let i = 1; i <= daysInMonth; i++) {
    let currentYearRain = 0;
    if (Math.random() < 0.4) currentYearRain = Math.random() * averageDailyRainCurrent * 3;
    if (Math.random() < 0.1) currentYearRain += Math.random() * averageDailyRainCurrent * 5;

    let lastYearRain = 0;
    const lastYearFactor = 0.7 + Math.random() * 0.6;
    if (Math.random() < 0.35) lastYearRain = Math.random() * averageDailyRainLast * 3 * lastYearFactor;
    if (Math.random() < 0.08) lastYearRain += Math.random() * averageDailyRainLast * 5 * lastYearFactor;

    const currentTemperature = Math.floor(baseTemp + (Math.random() * 10) - 5 + (Math.random() * 4 - 2));
    // Simulate last year's temperature with slight variation from current year's simulated temp for the day
    const lastYearTemperature = Math.floor(currentTemperature - 2 + (Math.random() * 4));


    dailyData.push({
      day: i,
      rainfallCurrentYear: parseFloat(currentYearRain.toFixed(1)),
      rainfallLastYear: parseFloat(lastYearRain.toFixed(1)),
      temperatureCurrentYear: currentTemperature,
      temperatureLastYear: lastYearTemperature,
    });
  }
  return dailyData;
};

const currentDate = new Date();
const currentYear = currentDate.getFullYear();

export const UGANDA_DAILY_RAINFALL_SIMULATED: SimulatedDailyRainfall = {};

const lastYearRainfallModifier = (avg: number) => avg * (0.8 + Math.random() * 0.4);

ALL_MONTHS.forEach((monthName, monthIndex) => {
  const daysInThisMonth = new Date(currentYear, monthIndex + 1, 0).getDate();
  const monthlyStatsCurrent = UGANDA_RAINFALL_DATA.find(m => m.month === monthName);

  const monthlyStatsLastYear = {
      Average: lastYearRainfallModifier(monthlyStatsCurrent?.Average || 50),
      Northern: lastYearRainfallModifier(monthlyStatsCurrent?.Northern || 40),
      Central: lastYearRainfallModifier(monthlyStatsCurrent?.Central || 60),
      Eastern: lastYearRainfallModifier(monthlyStatsCurrent?.Eastern || 55),
      Western: lastYearRainfallModifier(monthlyStatsCurrent?.Western || 70),
  };

  UGANDA_DAILY_RAINFALL_SIMULATED[monthName] = {
    "Average": generateRandomDailyData(daysInThisMonth, monthlyStatsCurrent?.Average || 50, monthlyStatsLastYear.Average, "Average"),
    "Northern": generateRandomDailyData(daysInThisMonth, monthlyStatsCurrent?.Northern || 40, monthlyStatsLastYear.Northern, "Northern"),
    "Central": generateRandomDailyData(daysInThisMonth, monthlyStatsCurrent?.Central || 60, monthlyStatsLastYear.Central, "Central"),
    "Eastern": generateRandomDailyData(daysInThisMonth, monthlyStatsCurrent?.Eastern || 55, monthlyStatsLastYear.Eastern, "Eastern"),
    "Western": generateRandomDailyData(daysInThisMonth, monthlyStatsCurrent?.Western || 70, monthlyStatsLastYear.Western, "Western"),
  };
});
