'use client';

import React from 'react';
import { Calendar, type CalendarProps } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Appointment, Service } from '@/types';
import { format } from 'date-fns';
import { CalendarDays, Clock, Users, Sparkles, Hand, Footprints, Eye } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

interface AppointmentCalendarProps {
  appointments: Appointment[];
  availableServices: Service[];
  onDayClick: (date: Date) => void;
  selectedDateAppointments: Appointment[];
  selectedDate: Date | undefined;
}

const getIcon = (iconName: keyof typeof LucideIcons | 'Default'): React.ElementType => {
  if (iconName === 'Default' || !LucideIcons[iconName]) {
    return LucideIcons.Sparkles;
  }
  return LucideIcons[iconName] as React.ElementType;
};

export default function AppointmentCalendar({ appointments, availableServices, onDayClick, selectedDateAppointments, selectedDate }: AppointmentCalendarProps) {
  
  const DayContentWithDot: CalendarProps['components']['DayContent'] = ({ date, displayMonth }) => {
    const isBooked = appointments.some(app => 
      app.date.getFullYear() === date.getFullYear() &&
      app.date.getMonth() === date.getMonth() &&
      app.date.getDate() === date.getDate()
    );

    // Default rendering from react-day-picker for the date number
    const dateNumber = <>{date.getDate()}</>;
    
    return (
      <div className="day-booked-dot-container w-full h-full flex items-center justify-center">
        {dateNumber}
        {isBooked && <span className="day-booked-dot"></span>}
      </div>
    );
  };
  
  return (
    <div className="space-y-6">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl font-headline">
            <CalendarDays className="mr-2 h-6 w-6 text-primary" />
            Appointment Calendar
          </CardTitle>
          <CardDescription className="font-body">
            View your scheduled appointments. Click a day to see details. A dot indicates a booked day.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(day) => { if(day) onDayClick(day); }}
            components={{ DayContent: DayContentWithDot }}
            className="rounded-md border p-4"
            modifiersClassNames={{
              selected: 'bg-primary text-primary-foreground hover:bg-primary/90 focus:bg-primary/90',
              today: 'bg-accent text-accent-foreground',
            }}
          />
        </CardContent>
      </Card>

      {selectedDate && (
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl font-headline">Appointments for {format(selectedDate, 'EEEE, MMMM do')}</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDateAppointments.length > 0 ? (
              <ScrollArea className="h-[300px] pr-4">
                <ul className="space-y-4">
                  {selectedDateAppointments.map(app => {
                    const serviceObjects = app.services.map(serviceId => {
                      const serviceInfo = availableServices.find(s => s.id === serviceId);
                      return serviceInfo || { id: serviceId, name: `Unknown Service (${serviceId})`, iconName: 'Default' as const };
                    });
                    return (
                      <li key={app.id} className="p-4 border rounded-lg shadow-sm bg-background hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                           <p className="font-semibold text-lg text-primary font-body flex items-center">
                            <Clock className="mr-2 h-5 w-5" /> {app.time}
                          </p>
                           <p className="text-sm text-muted-foreground font-body flex items-center">
                            <Users className="mr-1 h-4 w-4" /> {app.groupSize} person{app.groupSize > 1 ? 's' : ''}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium mb-1 font-body">Services:</p>
                          <ul className="list-disc list-inside ml-4 space-y-1">
                            {serviceObjects.map(service => {
                              const IconComponent = getIcon(service.iconName);
                              return (
                                <li key={service.id} className="text-sm font-body flex items-center">
                                  <IconComponent className="mr-2 h-4 w-4 text-secondary" /> {service.name}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </ScrollArea>
            ) : (
              <p className="text-muted-foreground font-body">No appointments scheduled for this day.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
