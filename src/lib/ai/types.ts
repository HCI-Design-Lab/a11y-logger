export interface AIAnalysisResult {
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  wcag_codes: string[];
  user_impact: string;
  suggested_fix: string;
  confidence: number; // 0-1
}

export interface AIProvider {
  analyzeIssue(plainText: string): Promise<AIAnalysisResult>;
  generateReportSection(context: string, sectionTitle: string): Promise<string>;
  generateVpatRemarks(issueSummary: string, criterion: string): Promise<string>;
  testConnection(): Promise<{ ok: boolean; error?: string }>;
}
