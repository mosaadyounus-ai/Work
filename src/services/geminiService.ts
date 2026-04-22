export interface OracleInsight {
  synthesis: string;
  strategicPosture: string;
  risks: string[];
  recommendations: string[];
}

export async function generateOracleAnalysis(metrics: any): Promise<OracleInsight> {
  const response = await fetch("/api/oracle", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(metrics)
  });

  if (!response.ok) {
    throw new Error(`Oracle server responded with ${response.status}`);
  }

  return response.json();
}
