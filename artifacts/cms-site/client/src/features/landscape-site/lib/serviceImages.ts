import { LANDSCAPE_IMAGE_BASE } from "@/features/landscape-site/content";

function url(concept: string): string {
  return `${LANDSCAPE_IMAGE_BASE}/services/${concept}.png`;
}

// slug -> (service item title -> image concept filename, without extension)
const SERVICE_CONCEPTS: Record<string, Record<string, string>> = {
  "residential-landscaping": {
    "Custom Landscape Design": "landscape-design",
    "Plant & Shrub Installation": "plant-shrub",
    "Sod Installation": "sod",
    "Seasonal Color Programs": "seasonal-color",
    "Bed Creation & Renovation": "garden-beds",
  },
  "residential-hardscape": {
    "Patio Installation": "patio",
    "Walkways & Pathways": "walkway",
    "Retaining Walls": "retaining-wall",
    "Decorative Borders & Edging": "edging",
    "Steps & Stairs": "steps",
  },
  "drainage-solutions": {
    "French Drain Installation": "french-drain",
    "Yard Regrading & Grading": "regrading",
    "Catch Basin Installation": "catch-basin",
    "Downspout Extensions & Management": "downspout",
    Swales: "swale",
  },
  "mulching-and-planting": {
    "Types of Mulch We Install": "mulch",
    "Benefits of Professional Mulching": "mulched-landscape",
    "How Much Mulch Do You Need?": "mulch-delivery",
    "Seasonal Flower Planting": "seasonal-color",
    "Shrub & Ornamental Grass Installation": "ornamental-grass",
    "Bed Preparation & Cleanup": "garden-beds",
  },
  "commercial-landscaping": {
    "Entryway & Signage Landscaping": "commercial-entryway",
    "Seasonal Color Programs": "commercial-seasonal-color",
    "Commercial Sod Installation": "commercial-sod",
    "Tree & Shrub Planting": "commercial-plant-shrub",
    "Mulch Installation for Commercial Properties": "commercial-mulch",
    "Bed Creation & Renovation": "commercial-garden-beds",
  },
  "commercial-hardscape": {
    "Parking Lot Islands & Borders": "parking-island",
    "Commercial Walkways & Paths": "commercial-walkway",
    "Retaining Walls for Commercial Sites": "commercial-retaining-wall",
    "Dumpster Enclosures": "dumpster-enclosure",
    "Outdoor Seating Areas & Plazas": "plaza",
    "Steps, Ramps & Entry Features": "commercial-steps",
  },
  "commercial-drainage": {
    "French Drain Systems for Commercial Sites": "commercial-french-drain",
    "Catch Basin Installation & Maintenance": "commercial-catch-basin",
    "Site Regrading & Grading": "commercial-regrading",
    "Stormwater Management Solutions": "stormwater",
    "Downspout & Roof Drainage Management": "commercial-downspout",
    "Erosion Control & Stabilization": "commercial-erosion",
  },
  "hoa-services": {
    "Common Area Grounds Maintenance": "commercial-grounds-maintenance",
    "Entrance & Signage Landscaping": "commercial-entryway",
    "Seasonal Color & Planting Programs": "commercial-seasonal-color",
    "Community-Wide Mulch Programs": "commercial-mulch",
    "Tree & Shrub Maintenance": "commercial-tree-shrub-maintenance",
    "Drainage Management for HOA Properties": "commercial-french-drain",
    "Common Area Hardscape Maintenance": "plaza",
  },
};

export function getServiceImages(slug: string): Record<string, string> {
  const map = SERVICE_CONCEPTS[slug];
  if (!map) return {};
  const out: Record<string, string> = {};
  for (const [title, concept] of Object.entries(map)) {
    const u = url(concept);
    if (u) out[title] = u;
  }
  return out;
}
