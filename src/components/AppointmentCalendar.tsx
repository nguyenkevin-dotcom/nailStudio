
'use client';

import React, { useEffect, useState } from 'react';
import { Calendar, type CalendarProps } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import type { Appointment, Service } from '@/types';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addDays, subDays } from 'date-fns';
import { CalendarDays, Users, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

interface AppointmentCalendarProps {
  appointments: Appointment[];
  availableServices: Service[];
  onCalendarDayClick: (date: Date) => void;
  selectedDate: Date | undefined;
  onDeleteAppointment: (appointmentId: string) => void;
  timeSlots: string[];
  calendarView: 'week' | 'day';
}

const getIcon = (iconName: keyof typeof LucideIcons | 'Default'): React.ElementType => {
  if (iconName === 'Default' || !LucideIcons[iconName]) {
    return LucideIcons.Sparkles;
  }
  return LucideIcons[iconName] as React.ElementType;
};

const appointmentCoversSlot = (appointment: Appointment, day: Date, slot: string, allTimeSlots: string[]): boolean => {
  if (!isSameDay(new Date(appointment.date), day)) {
    return false;
  }
  const appointmentStartIndex = allTimeSlots.indexOf(appointment.time);
  const slotIndex = allTimeSlots.indexOf(slot);
  if (appointmentStartIndex === -1 || slotIndex === -1) return false;

  const duration = appointment.services.length || 1;
  return slotIndex >= appointmentStartIndex && slotIndex < (appointmentStartIndex + duration);
};


export default function AppointmentCalendar({
  appointments,
  availableServices,
  onCalendarDayClick,
  selectedDate,
  onDeleteAppointment,
  timeSlots,
  calendarView,
}: AppointmentCalendarProps) {
  const [currentViewDays, setCurrentViewDays] = useState<Date[]>([]);

  useEffect(() => {
    const baseDate = selectedDate || new Date();

    if (calendarView === 'week') {
      const weekStart = startOfWeek(baseDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(baseDate, { weekStartsOn: 1 });
      const daysInView = eachDayOfInterval({ start: weekStart, end: weekEnd });
      setCurrentViewDays(daysInView);
    } else { // calendarView === 'day'
      setCurrentViewDays([baseDate]);
    }
  }, [selectedDate, calendarView]);

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

  const getCustomersInSlot = (day: Date, timeSlot: string): number => {
    return appointments
      .filter(app => appointmentCoversSlot(app, day, timeSlot, timeSlots))
      .reduce((sum, app) => sum + app.groupSize, 0);
  };

  const handlePrev = () => {
    const currentBase = selectedDate || new Date();
    if (calendarView === 'week') {
      onCalendarDayClick(subDays(currentBase, 7));
    } else {
      onCalendarDayClick(subDays(currentBase, 1));
    }
  };

  const handleNext = () => {
     const currentBase = selectedDate || new Date();
     if (calendarView === 'week') {
      onCalendarDayClick(addDays(currentBase, 7));
    } else {
      onCalendarDayClick(addDays(currentBase, 1));
    }
  };

  const getTitle = () => {
    if (currentViewDays.length === 0 && selectedDate) {
        return calendarView === 'week'
            ? `${format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'MMM do')} - ${format(endOfWeek(selectedDate, { weekStartsOn: 1 }), 'MMM do, yyyy')}`
            : format(selectedDate, 'EEEE, MMM do, yyyy');
    }
    if (currentViewDays.length > 0) {
        return calendarView === 'week'
            ? `${format(currentViewDays[0], 'MMM do')} - ${format(currentViewDays[currentViewDays.length - 1], 'MMM do, yyyy')}`
            : format(currentViewDays[0], 'EEEE, MMM do, yyyy');
    }
    // Fallback if selectedDate is also undefined initially, though HomePage tries to set it.
    const today = new Date();
    return calendarView === 'week'
        ? `${format(startOfWeek(today, { weekStartsOn: 1 }), 'MMM do')} - ${format(endOfWeek(today, { weekStartsOn: 1 }), 'MMM do, yyyy')}`
        : format(today, 'EEEE, MMM do, yyyy');
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
            Select a day to view appointments. A dot indicates a booked day. Each service takes 1 hour.
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
            weekStartsOn={1} // Monday
          />
        </CardContent>
      </Card>

      {/* Render grid view only if there's a selected date or currentViewDays are set */}
      {(selectedDate || currentViewDays.length > 0) && (
        <Card className="shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={handlePrev} aria-label={calendarView === 'week' ? "Previous week" : "Previous day"}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <CardTitle className="text-xl font-headline text-center">
                 {getTitle()}
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={handleNext} aria-label={calendarView === 'week' ? "Next week" : "Next day"}>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="w-full">
              <div className="min-w-[400px] md:min-w-[700px] lg:min-w-full"> {/* Adjusted min-width for better responsiveness */}
                <div className="grid" style={{
                  gridTemplateColumns: `auto repeat(${currentViewDays.length}, minmax(100px, 1fr))`,
                  gridTemplateRows: `auto repeat(${timeSlots.length}, minmax(6rem, auto))`
                }}>

                  <div className="p-2 border-b border-r border-border sticky top-0 left-0 bg-card z-30"></div> {/* Empty top-left cell */}


                  {currentViewDays.map((day, dayIndex) => (
                      <div key={format(day, "yyyy-MM-dd'-header'")} style={{ gridColumn: dayIndex + 2, gridRow: 1 }}
                           className={`p-2 border-b border-r border-border font-semibold text-sm text-center sticky top-0 bg-card z-20 font-body ${isSameDay(day, new Date()) ? 'text-primary' : ''}`}>
                          {format(day, 'EEE')} <br /> {format(day, 'd')}
                      </div>
                  ))}


                  {timeSlots.map((timeSlot, timeIndex) => (
                      <React.Fragment key={`timeslot-row-${timeSlot}`}>

                          <div style={{ gridColumn: 1, gridRow: timeIndex + 2 }}
                               className="p-2 border-b border-r border-border font-semibold text-xs h-full flex items-center justify-center bg-card sticky left-0 z-20 font-body">
                              {timeSlot}
                          </div>

                          {currentViewDays.map((day, dayIndex) => (
                              <div key={`cell-${format(day, 'yyyy-MM-dd')}-${timeSlot}`}
                                   style={{ gridColumn: dayIndex + 2, gridRow: timeIndex + 2 }}
                                   className="p-1 border-b border-r border-border min-h-[6rem] relative group">
                                  {(() => {
                                      const customers = getCustomersInSlot(day, timeSlot);
                                      return customers > 0 ? (
                                          <div className="absolute bottom-1 right-1 text-[10px] text-muted-foreground bg-background/70 px-1 rounded-sm font-body z-10">
                                              {customers}/6
                                          </div>
                                      ) : null;
                                  })()}
                              </div>
                          ))}
                      </React.Fragment>
                  ))}


                  {appointments.map(app => {
                      const dayIndex = currentViewDays.findIndex(d => isSameDay(new Date(app.date), d));
                      if (dayIndex === -1) return null;

                      const startTimeIndex = timeSlots.indexOf(app.time);
                      if (startTimeIndex === -1) return null;

                      const duration = app.services.length || 1;

                      const serviceObjects = app.services.map(serviceId => {
                        const serviceInfo = availableServices.find(s => s.id === serviceId);
                        return serviceInfo || { id: serviceId, name: `Unknown (${serviceId})`, iconName: 'Default' as const };
                      });

                      const cardMaxHeight = `${Math.max(1, duration) * 6 - 0.5}rem`;

                      return (
                          <div
                              key={app.id}
                              className="bg-primary/20 p-1.5 rounded-md text-xs border border-primary/40 hover:bg-primary/30 m-0.5 shadow-sm flex flex-col"
                              style={{
                                  gridColumnStart: dayIndex + 2,
                                  gridRowStart: startTimeIndex + 2,
                                  gridRowEnd: `span ${duration}`,
                                  zIndex: 5,
                                  overflow: 'hidden',
                                  position: 'relative',
                              }}
                          >
                              <div className="flex justify-between items-start mb-0.5 flex-shrink-0">
                                  <p className="font-semibold text-primary truncate font-body flex-grow mr-1">{app.name}</p>
                                  <Button
                                      variant="ghost"
                                      size="icon"
                                      className="text-destructive hover:text-destructive/80 h-5 w-5 shrink-0"
                                      onClick={() => onDeleteAppointment(app.id)}
                                      aria-label="Delete appointment"
                                  >
                                      <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                              </div>
                              <p className="text-muted-foreground font-body mb-0.5 flex-shrink-0"><Users className="inline h-3 w-3 mr-1" />{app.groupSize}</p>
                              <ScrollArea className="flex-grow" style={{ maxHeight: `calc(${cardMaxHeight} - 3rem)` }}>
                                  <ul className="mt-0.5 space-y-0.5">
                                      {serviceObjects.map(service => {
                                          const SvcIcon = getIcon(service.iconName);
                                          return (
                                          <li key={service.id} className="flex items-center text-muted-foreground font-body leading-tight">
                                              <SvcIcon className="inline h-3 w-3 mr-1 text-secondary shrink-0"/>
                                              <span className="truncate">{service.name}</span>
                                          </li>
                                      )})}
                                  </ul>
                              </ScrollArea>
                          </div>
                      );
                  })}
                </div>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

