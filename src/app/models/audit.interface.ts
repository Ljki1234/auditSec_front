export interface ManualTest {
  id: string;
  name: string;
  status: 'pending' | 'success' | 'failed' | 'vulnerable';
  severity: 'critical' | 'high' | 'medium' | 'low';
  recommendations: string;
  description?: string;
  lastRun?: Date;
}

export interface AuditResult {
  url: string;
  timestamp: Date;
  tests: ManualTest[];
  overallStatus: 'in-progress' | 'completed' | 'failed';
}
