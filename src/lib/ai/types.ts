export interface AIAnalysisResult {
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  wcag_codes: string[];
  user_impact: string;
  suggested_fix: string;
  confidence: number; // 0-1
}

export interface VpatGenerationContext {
  criterion: { code: string; name: string; description: string };
  issues: { title: string; severity: string; url: string; description: string }[];
}

export interface VpatRowGenerationResult {
  remarks: string;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
}

export interface AIProvider {
  analyzeIssue(plainText: string): Promise<AIAnalysisResult>;
  generateReportSection(context: string, sectionTitle: string): Promise<string>;
  generateExecutiveSummaryHtml(context: string): Promise<string>;
  generateVpatRemarks(issueSummary: string, criterion: string): Promise<string>;
  generateVpatRow(context: VpatGenerationContext): Promise<VpatRowGenerationResult>;
  testConnection(): Promise<{ ok: boolean; error?: string }>;
}
