export const CATEGORY_DEPRECIATION_DEFAULTS: Record<string, { usefulLifeYears: number; salvagePercent: number }> = {
  laptop: { usefulLifeYears: 3, salvagePercent: 10 },
  desktop: { usefulLifeYears: 4, salvagePercent: 10 },
  monitor: { usefulLifeYears: 5, salvagePercent: 15 },
  furniture: { usefulLifeYears: 7, salvagePercent: 20 },
  vehicle: { usefulLifeYears: 5, salvagePercent: 15 },
  phone: { usefulLifeYears: 2, salvagePercent: 5 },
  tablet: { usefulLifeYears: 3, salvagePercent: 10 },
  printer: { usefulLifeYears: 5, salvagePercent: 10 },
};

export const DEFAULT_USEFUL_LIFE_YEARS = 5;
export const DEFAULT_SALVAGE_PERCENT = 10;
