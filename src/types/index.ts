import type { LucideIcon } from 'lucide-react';

export interface Service {
  id: string;
  name: string;
  iconName: keyof typeof import('lucide-react') | 'Default'; // Allow specific Lucide icon names
}

export interface Appointment {
  id: string;
  name: string; // Added name field
  date: Date;
  time: string;
  services: string[]; // Array of service IDs
  groupSize: number;
}
