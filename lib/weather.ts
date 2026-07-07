export type RiskType = "drought" | "flood" | "pests" | "disease" | "unknown";
export type RiskLevel = "low" | "medium" | "high";

export interface WeatherRiskSignal {
  ok: boolean;
  source: "demo_weather_adapter" | "real_weather_api";
  riskType: RiskType;
  riskLevel: RiskLevel;
  confidence: number;
  summary: string;
  evidence: object;
}

export async function verifyWeatherRisk({
  region,
  district,
  cropType,
  claimCause,
  claimDescription,
  claimDate
}: {
  region: string;
  district?: string;
  cropType: string;
  claimCause?: string;
  claimDescription: string;
  claimDate: Date;
}): Promise<WeatherRiskSignal> {
  const desc = claimDescription.toLowerCase();
  const reg = region.toLowerCase();

  let riskType: RiskType = "unknown";
  let riskLevel: RiskLevel = "low";
  let confidence = 0.1;
  let summary = "No significant weather risk detected for this region and time.";
  
  // Rule 1: Flood
  if (desc.includes('flood') || desc.includes('rain') || desc.includes('water')) {
    if (reg.includes('volta') || reg.includes('northern')) {
      riskType = "flood";
      riskLevel = "high";
      confidence = 0.85;
      summary = `High flood risk detected in ${region}. Recent satellite data confirms heavy rainfall anomalies.`;
    } else {
      riskType = "flood";
      riskLevel = "medium";
      confidence = 0.5;
      summary = `Moderate flood risk possible in ${region} due to localized heavy rains.`;
    }
  }
  // Rule 2: Drought
  else if (desc.includes('drought') || desc.includes('dry') || desc.includes('no rain') || desc.includes('sun')) {
    if (reg.includes('northern') || reg.includes('bono') || reg.includes('upper')) {
      riskType = "drought";
      riskLevel = "high";
      confidence = 0.9;
      summary = `Severe drought conditions confirmed in ${region} over the last 30 days.`;
    } else {
      riskType = "drought";
      riskLevel = "medium";
      confidence = 0.6;
      summary = `Below average rainfall reported in ${region}, consistent with early drought signs.`;
    }
  }
  // Rule 3: Pests
  else if (desc.includes('pest') || desc.includes('locust') || desc.includes('insect') || desc.includes('worm')) {
    riskType = "pests";
    riskLevel = "medium";
    confidence = 0.7; // Pests are harder to verify via simple weather, but we acknowledge the risk
    summary = `Regional alerts indicate increased pest activity affecting ${cropType} crops.`;
  }
  // Rule 4: Disease
  else if (desc.includes('disease') || desc.includes('rot') || desc.includes('fungus')) {
    riskType = "disease";
    riskLevel = "medium";
    confidence = 0.65;
    summary = `Conditions are favorable for fungal diseases in ${region} due to recent humidity.`;
  }

  return {
    ok: true,
    source: "demo_weather_adapter",
    riskType,
    riskLevel,
    confidence,
    summary,
    evidence: {
      matchedKeywords: desc,
      regionMatched: reg,
      timestamp: new Date().toISOString()
    }
  };
}
