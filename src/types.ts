export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type IssueType = 'pothole' | 'streetlight' | 'garbage' | 'flooding' | 'encroachment' | 'sewage' | 'tree' | 'other';
export type ComplaintStatus = 'open' | 'assigned' | 'in_progress' | 'resolved' | 'escalated';
export type EscalationLevel = 1 | 2 | 3 | 4 | 5;

export interface Corporator {
  id: string;
  name: string;
  ward: number;
  wardName: string;
  party: string;
  phone: string;
  email: string;
  photo: string;
  resolvedOnTime: number;
  totalComplaints: number;
  pendingOver7Days: number;
  ignoredOver30Days: number;
  rating: number;
  trend: 'up' | 'down' | 'stable';
  since: string;
}

export interface MLA {
  id: string;
  name: string;
  constituency: string;
  party: string;
  photo: string;
  rating: number;
  totalComplaints: number;
  resolvedRate: number;
}

export interface Complaint {
  id: string;
  title: string;
  description: string;
  type: IssueType;
  severity: Severity;
  status: ComplaintStatus;
  wardId: number;
  wardName: string;
  lat: number;
  lng: number;
  address: string;
  upvotes: number;
  comments: number;
  filedAt: string;
  resolvedAt?: string;
  escalationLevel: EscalationLevel;
  corporatorId: string;
  mlaId: string;
  photoUrl: string;
  afterPhotoUrl?: string;
  reporterName: string;
  aiClassification?: string;
  ccedMLA: boolean;
  slaHours: number;
  hoursElapsed: number;
}
