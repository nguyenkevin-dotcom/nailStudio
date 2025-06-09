
'use client';

import React, { useEffect, useState } from 'react';
import { Calendar, type CalendarProps } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import type { Appointment, Service } from '@/types';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addDays, subDays } from 'date-fns';
import { CalendarDays, Clock, Users, Sparkles, UserCircle, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

interface AppointmentCalendarProps {
  appointments: Appointment[];
  availableServices: Service[];
  onCalendarDayClick: (date: Date) => void;
  selectedDate: Date | undefined;
  onDeleteAppointment: (appointmentId: string) => void;
  timeSlots: string[];
}

const getIcon = (iconName: keyof typeof LucideIcons | 'Default'): React.ElementType => {
  if (iconName === 'Default' || !LucideIcons[iconName]) {
    return LucideIcons.Sparkles;
  }
  return LucideIcons[iconName] as React.ElementType;
};

export default function AppointmentCalendar({
  appointments,
  availableServices,
  onCalendarDayClick,
  selectedDate,
  onDeleteAppointment,
  timeSlots,
}: AppointmentCalendarProps) {
  const [currentWeekDays, setCurrentWeekDays] = useState<Date[]>([]);

  useEffect(() => {
    if (selectedDate) {
      const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Week starts on Monday
      const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
      const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });
      setCurrentWeekDays(daysInWeek);
    } else {
      setCurrentWeekDays([]);
    }
  }, [selectedDate]);

  const DayContentWithDot: CalendarProps['components']['DayContent'] = ({ date }) => {
    const isBooked = appointments.some(app => isSameDay(new Date(app.date), date));
    const dateNumber = <>{date.getDate()}</>;
    return (
      <div className="day-booked-dot-container w-full h-full flex items-center justify-center">
        {dateNumber}
        {isBooked && <span className="day-booked-dot"></span>}
      </div>
    );
  };

  const getAppointmentsForSlot = (day: Date, timeSlot: string): Appointment[] => {
    return appointments
      .filter(app => isSameDay(new Date(app.date), day) && app.time === timeSlot)
      .sort((a,b) => a.name.localeCompare(b.name));
  };
  
  const getCustomersInSlot = (day: Date, timeSlot: string): number => {
    return appointments
      .filter(app => isSameDay(new Date(app.date), day) && app.time === timeSlot)
      .reduce((sum, app) => sum + app.groupSize, 0);
  };

  const handlePrevWeek = () => {
    if (selectedDate) {
      onCalendarDayClick(subDays(selectedDate, 7));
    }
  };

  const handleNextWeek = () => {
    if (selectedDate) {
      onCalendarDayClick(addDays(selectedDate, 7));
    }
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
            onSelect={(day) => { if (day) onCalendarDayClick(day); }}
            components={{ DayContent: DayContentWithDot }}
            className="rounded-md border p-4"
            modifiersClassNames={{
              selected: 'bg-primary text-primary-foreground hover:bg-primary/90 focus:bg-primary/90',
              today: 'bg-accent text-accent-foreground',
            }}
            initialFocus={!!selectedDate}
          />
        </CardContent>
      </Card>

      {selectedDate && currentWeekDays.length > 0 && (
        <Card className="shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={handlePrevWeek} aria-label="Previous week">
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <CardTitle className="text-xl font-headline text-center">
                 {format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'MMM do')} - {format(endOfWeek(selectedDate, { weekStartsOn: 1 }), 'MMM do, yyyy')}
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={handleNextWeek} aria-label="Next week">
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="w-full">
              <div className="min-w-[700px] lg:min-w-full"> {/* Ensures horizontal scroll on small screens */}
                <div className="grid grid-cols-[auto_repeat(7,1fr)] border border-border rounded-lg">
                  {/* Header Row */}
                  <div className="p-2 border-b border-r border-border font-semibold text-sm sticky top-0 bg-card z-10 font-body">Time</div>
                  {currentWeekDays.map(day => (
                    <div key={format(day, "yyyy-MM-dd'-header'")} 
                         className={`p-2 border-b border-r border-border font-semibold text-sm text-center sticky top-0 bg-card z-10 font-body ${isSameDay(day, new Date()) ? 'text-primary' : ''}`}>
                      {format(day, 'EEE')} <br /> {format(day, 'd')}
                    </div>
                  ))}

                  {/* Time Slot Rows */}
                  {timeSlots.map(timeSlot => (
                    <React.Fragment key={timeSlot}>
                      <div className="p-2 border-b border-r border-border font-semibold text-xs h-32 flex items-center justify-center bg-card font-body">
                        {timeSlot}
                      </div>
                      {currentWeekDays.map(day => {
                        const dayKey = format(day, 'yyyy-MM-dd');
                        const appointmentsInSlot = getAppointmentsForSlot(day, timeSlot);
                        const customersInSlot = getCustomersInSlot(day, timeSlot);

                        return (
                          <div key={`${dayKey}-${timeSlot}`} className="p-1 border-b border-r border-border min-h-[8rem] relative group">
                            {appointmentsInSlot.length > 0 ? (
                              <ScrollArea className="h-full max-h-[7.5rem]">
                                <div className="space-y-1 p-1">
                                {appointmentsInSlot.map(app => {
                                  const serviceObjects = app.services.map(serviceId => {
                                    const serviceInfo = availableServices.find(s => s.id === serviceId);
                                    return serviceInfo || { id: serviceId, name: `Unknown (${serviceId})`, iconName: 'Default' as const };
                                  });
                                  return (
                                    <div key={app.id} className="bg-primary/10 p-1.5 rounded-md text-xs border border-primary/30 hover:bg-primary/20 transition-colors">
                                      <div className="flex justify-between items-start">
                                        <p className="font-semibold text-primary truncate font-body">{app.name}</p>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive hover:text-destructive/80 h-5 w-5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => onDeleteAppointment(app.id)}
                                            aria-label="Delete appointment"
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                      </div>
                                      <p className="text-muted-foreground font-body"><Users className="inline h-3 w-3 mr-1" />{app.groupSize}</p>
                                      <ul className="mt-0.5">
                                        {serviceObjects.map(service => {
                                          const Icon = getIcon(service.iconName);
                                          return (
                                          <li key={service.id} className="flex items-center text-muted-foreground font-body">
                                            <Icon className="inline h-3 w-3 mr-1 text-secondary"/> {service.name}
                                          </li>
                                        )})}
                                      </ul>
                                    </div>
                                  );
                                })}
                                </div>
                              </ScrollArea>
                            ) : (
                              <div className="h-full w-full"></div> // Empty cell
                            )}
                             {customersInSlot > 0 && (
                                <div className="absolute bottom-1 right-1 text-[10px] text-muted-foreground bg-background/50 px-1 rounded-sm font-body">
                                  {customersInSlot}/6
                                </div>
                              )}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

