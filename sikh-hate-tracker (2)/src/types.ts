export type Severity = 'low' | 'medium' | 'high';

export type IncidentCategory =
  | 'verbal'
  | 'physical'
  | 'vandalism'
  | 'harassment'
  | 'cyberbullying'
  | 'institutional'
  | 'other';

export interface Incident {
  id: string;
  title: string;
  description: string;
  date: string;
  country: string;
  city?: string;
  latitude: number;
  longitude: number;
  sourceUrl?: string;
  severity: Severity;
  category: IncidentCategory;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface Bulletin {
  id: string;
  title: string;
  content: string;
  date: string;
  createdAt: string;
}

export interface Magazine {
  id: string;
  title: string;
  issueNumber: string;
  publishDate: string;
  description?: string;
  fileName: string;
  fileSize: string;
  fileUrl: string; // Dynamic path/URL to access PDF
  createdAt: string;
}
