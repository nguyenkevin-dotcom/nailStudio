
import type { LucideIcon } from 'lucide-react';

export interface Service {
  id: string;
  name: string;
  iconName: keyof typeof import('lucide-react') | 'Default'; // Allow specific Lucide icon names
}

export interface Appointment {
  id: number; // Changed from string to number for database ID
  name: string;
  date: Date;
  time: string;
  services: string[]; // Array of service IDs
  groupSize: number;
  phoneNumber?: string; // Optional phone number
}

// Type for creating appointments, ID is generated by DB
export type NewAppointment = Omit<Appointment, 'id'>;
