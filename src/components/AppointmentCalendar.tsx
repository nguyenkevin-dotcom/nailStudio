
'use client';

import React, { useEffect, useState } from 'react';
import { Calendar, type CalendarProps } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import type { Appointment, Service } from '@/types';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { CalendarDays, Clock, Users, Sparkles, UserCircle, Trash2 } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

interface AppointmentCalendarProps {
  appointments: Appointment[]; // All appointments
  availableServices: Service[];
  onCalendarDayClick: (date: Date) => void; // To update selectedDate in parent
  selectedDate: Date | undefined; // Current selected date from parent
  onDeleteAppointment: (appointmentId: string) => void;
}

const getIcon = (iconName: keyof typeof LucideIcons | 'Default'): React.ElementType => {
  if (iconName === 'Default' || !LucideIcons[iconName]) {
    return LucideIcons.Sparkles; // Default icon
  }
  return LucideIcons[iconName] as React.ElementType;
};

export default function AppointmentCalendar({ 
  appointments, 
  availableServices, 
  onCalendarDayClick, 
  selectedDate, 
  onDeleteAppointment 
}: AppointmentCalendarProps) {
  
  const [currentWeekDays, setCurrentWeekDays] = useState<Date[]>([]);
  const [weekAppointments, setWeekAppointments] = useState<{[key: string]: Appointment[]}>({});

  useEffect(() => {
    if (selectedDate) {
      const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Week starts on Monday
      const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
      const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });
      setCurrentWeekDays(daysInWeek);

      const appointmentsInWeek = appointments.filter(app => {
        const appDate = new Date(app.date); // Ensure app.date is a Date object
        return appDate >= weekStart && appDate <= weekEnd;
      });

      const groupedByDay: {[key: string]: Appointment[]} = {};
      daysInWeek.forEach(day => {
        const dayKey = format(day, 'yyyy-MM-dd');
        groupedByDay[dayKey] = appointmentsInWeek
          .filter(app => isSameDay(new Date(app.date), day))
          .sort((a,b) => a.time.localeCompare(b.time));
      });
      setWeekAppointments(groupedByDay);
    } else {
      setCurrentWeekDays([]);
      setWeekAppointments({});
    }
  }, [selectedDate, appointments]);
  
  const DayContentWithDot: CalendarProps['components']['DayContent'] = ({ date }) => {
    const isBooked = appointments.some(app => 
      isSameDay(new Date(app.date), date)
    );
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
            Select a day to view appointments for that week. A dot indicates a booked day.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(day) => { if(day) onCalendarDayClick(day); }}
            components={{ DayContent: DayContentWithDot }}
            className="rounded-md border p-4"
            modifiersClassNames={{
              selected: 'bg-primary text-primary-foreground hover:bg-primary/90 focus:bg-primary/90',
              today: 'bg-accent text-accent-foreground',
            }}
            initialFocus={!!selectedDate} // Ensure calendar focuses if a date is selected
          />
        </CardContent>
      </Card>

      {selectedDate && currentWeekDays.length > 0 && (
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl font-headline">
              Appointments for Week: {format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'MMM do')} - {format(endOfWeek(selectedDate, { weekStartsOn: 1 }), 'MMM do, yyyy')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] lg:h-[500px] pr-3">
              <div className="space-y-6">
                {currentWeekDays.map(day => {
                  const dayKey = format(day, 'yyyy-MM-dd');
                  const appointmentsForDay = weekAppointments[dayKey] || [];
                  const totalCustomersForDay = appointmentsForDay.reduce((sum, app) => sum + app.groupSize, 0);
                  
                  return (
                    <div key={dayKey} className="py-3 border-b border-border last:border-b-0">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-lg font-body">{format(day, 'EEEE, MMMM do')}</h3>
                        {appointmentsForDay.length > 0 && (
                           <p className="text-sm text-muted-foreground font-body">
                             {totalCustomersForDay} customer{totalCustomersForDay > 1 ? 's' : ''}
                           </p>
                        )}
                      </div>
                      {appointmentsForDay.length > 0 ? (
                        <ul className="space-y-4">
                          {appointmentsForDay.map(app => {
                            const serviceObjects = app.services.map(serviceId => {
                              const serviceInfo = availableServices.find(s => s.id === serviceId);
                              return serviceInfo || { id: serviceId, name: `Unknown Service (${serviceId})`, iconName: 'Default' as const };
                            });
                            const totalCustomersForSlot = appointments
                              .filter(a => isSameDay(new Date(a.date), day) && a.time === app.time)
                              .reduce((sum, currentApp) => sum + currentApp.groupSize, 0);

                            return (
                              <li key={app.id} className="p-4 border rounded-lg shadow-sm bg-card hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1">
                                    <p className="font-semibold text-lg text-primary font-body flex items-center">
                                      <Clock className="mr-2 h-5 w-5" /> {app.time}
                                      <span className="ml-2 text-xs text-muted-foreground">({totalCustomersForSlot}/6 customers in slot)</span>
                                    </p>
                                    <p className="text-sm text-muted-foreground font-body flex items-center mt-1">
                                      <UserCircle className="mr-1 h-4 w-4" /> For: {app.name}
                                    </p>
                                  </div>
                                  <div className="flex flex-col items-end space-y-1">
                                      <p className="text-sm text-muted-foreground font-body flex items-center">
                                        <Users className="mr-1 h-4 w-4" /> {app.groupSize} person{app.groupSize > 1 ? 's' : ''}
                                      </p>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-destructive hover:text-destructive/80 h-8 w-8"
                                        onClick={() => onDeleteAppointment(app.id)}
                                        aria-label="Delete appointment"
                                      >
                                        <Trash2 className="h-5 w-5" />
                                      </Button>
                                  </div>
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
                      ) : (
                        <p className="text-muted-foreground font-body pl-1">No appointments scheduled for this day.</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
