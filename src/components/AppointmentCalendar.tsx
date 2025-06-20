
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, type CalendarProps } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import type { Appointment, Service } from '@/types';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addDays, subDays } from 'date-fns';
import { CalendarDays, Users, Trash2, ChevronLeft, ChevronRight, Phone } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';


interface AppointmentCalendarProps {
  appointments: Appointment[];
  availableServices: Service[];
  onCalendarDayClick: (date: Date) => void;
  selectedDate: Date | undefined;
  onDeleteAppointment: (appointmentId: number) => void; // Changed to number
  timeSlots: string[];
  calendarView: 'week' | 'day';
  onCalendarViewChange: (view: 'week' | 'day') => void;
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
  onCalendarViewChange,
}: AppointmentCalendarProps) {
  const [currentViewDays, setCurrentViewDays] = useState<Date[]>([]);

  useEffect(() => {
    const baseDate = selectedDate || new Date();

    if (calendarView === 'week') {
      const weekStart = startOfWeek(baseDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(baseDate, { weekStartsOn: 1 });
      const daysInView = eachDayOfInterval({ start: weekStart, end: weekEnd });
      setCurrentViewDays(daysInView);
    } else { 
      setCurrentViewDays([baseDate]);
    }
  }, [selectedDate, calendarView]);

  const DayContentWithDot = ({ date }: { date: Date }) => {
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
            ? `${format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'MMM do')} - ${format(endOfWeek(selectedDate, { weekStartsOn: 1 }), "MMM do, yyyy")}`
            : format(selectedDate, 'EEEE, MMM do, yyyy');
    }
    if (currentViewDays.length > 0) {
        return calendarView === 'week'
            ? `${format(currentViewDays[0], 'MMM do')} - ${format(currentViewDays[currentViewDays.length - 1], "MMM do, yyyy")}`
            : format(currentViewDays[0], 'EEEE, MMM do, yyyy');
    }
    const today = new Date();
    return calendarView === 'week'
        ? `${format(startOfWeek(today, { weekStartsOn: 1 }), 'MMM do')} - ${format(endOfWeek(today, { weekStartsOn: 1 }), "MMM do, yyyy")}`
        : format(today, 'EEEE, MMM do, yyyy');
  };

  const dayViewAppointmentsData = useMemo(() => {
    if (calendarView !== 'day' || currentViewDays.length === 0) {
      return [];
    }

    const selectedDayToRender = currentViewDays[0];
    const appointmentsOnSelectedDay = appointments
      .filter(app => isSameDay(new Date(app.date), selectedDayToRender))
      .sort((a, b) => {
        const timeAIndex = timeSlots.indexOf(a.time);
        const timeBIndex = timeSlots.indexOf(b.time);
        if (timeAIndex !== timeBIndex) return timeAIndex - timeBIndex;
        return a.id - b.id; 
      });

    const appointmentsByStartTime: { [time: string]: Appointment[] } = {};
    for (const app of appointmentsOnSelectedDay) {
      if (!appointmentsByStartTime[app.time]) {
        appointmentsByStartTime[app.time] = [];
      }
      appointmentsByStartTime[app.time].push(app);
    }

    const processed: (Appointment & { horizontalOverlapCount: number; horizontalOverlapIndex: number })[] = [];
    for (const time in appointmentsByStartTime) {
      const group = appointmentsByStartTime[time];
      group.forEach((app, index) => {
        processed.push({
          ...app,
          horizontalOverlapCount: group.length,
          horizontalOverlapIndex: index,
        });
      });
    }
    return processed;
  }, [appointments, timeSlots, calendarView, currentViewDays]);

  const cardFixedWidthRem = 8; 

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
              selected: cn(
                'bg-primary text-primary-foreground hover:bg-primary/90',
                'focus:bg-primary focus:text-primary-foreground', 
                'focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none'
              ),
              today: 'bg-accent text-accent-foreground',
            }}
            initialFocus={!!selectedDate}
            weekStartsOn={1} 
          />
        </CardContent>
      </Card>
      
      <div className="mb-4">
          <Tabs value={calendarView} onValueChange={(value) => onCalendarViewChange(value as 'week' | 'day')} className="w-full md:w-auto">
            <TabsList className="grid w-full grid-cols-2 md:inline-flex">
              <TabsTrigger value="week">Week View</TabsTrigger>
              <TabsTrigger value="day">Day View</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

      {(selectedDate || currentViewDays.length > 0) && (
        <>
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
                <div className="min-w-[400px] md:min-w-[700px] lg:min-w-full">
                  <div className="grid" style={{
                    gridTemplateColumns: `auto repeat(${currentViewDays.length}, minmax(100px, 1fr))`,
                    gridTemplateRows: `auto repeat(${timeSlots.length}, minmax(6rem, auto))`
                  }}>

                    <div className="p-2 border-b border-r border-border sticky top-0 left-0 bg-card z-30"></div>


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
                                    className={`border-b border-r border-border min-h-[6rem] relative group flex items-center justify-center p-0`}>
                                    {calendarView === 'week' ? (
                                        (() => {
                                            const customers = getCustomersInSlot(day, timeSlot);
                                            let textColorClass = 'text-base text-muted-foreground/70';
                                            if (customers === 6) {
                                                textColorClass = 'text-lg font-semibold text-[hsl(var(--slot-full-foreground))]';
                                            } else if (customers > 0) {
                                                textColorClass = 'text-lg font-semibold text-primary';
                                            }
                                            return (
                                                <div className={`w-full h-full flex items-center justify-center font-body ${textColorClass}`}>
                                                    {customers}/6
                                                </div>
                                            );
                                        })()
                                    ) : ( 
                                        (() => {
                                            const customers = getCustomersInSlot(day, timeSlot);
                                            return customers > 0 ? (
                                                <div className="absolute bottom-1 right-1 text-[10px] text-muted-foreground bg-background/70 px-1 rounded-sm font-body z-10">
                                                    {customers}/6
                                                </div>
                                            ) : null;
                                        })()
                                    )}
                                </div>
                            ))}
                        </React.Fragment>
                    ))}

                    {calendarView === 'day' &&
                        dayViewAppointmentsData.map(app => {
                            const appDate = new Date(app.date);
                            if (currentViewDays.length === 0 || !isSameDay(appDate, currentViewDays[0])) {
                              return null;
                            }
                            
                            const dayGridColumnIndex = 0; 
                            const startTimeIndex = timeSlots.indexOf(app.time);
                            if (startTimeIndex === -1) return null;

                            const duration = app.services.length || 1;
                            const serviceObjects = app.services.map(serviceId => {
                              const serviceInfo = availableServices.find(s => s.id === serviceId);
                              return serviceInfo || { id: serviceId, name: `Unknown (${serviceId})`, iconName: 'Default' as const };
                            });
                            
                            const cardVisualHeightInRem = Math.max(1, duration) * 6 - 0.5; 
                            const { horizontalOverlapCount, horizontalOverlapIndex } = app;

                            const dynamicStyles: React.CSSProperties = {
                                gridColumnStart: dayGridColumnIndex + 2,
                                gridRowStart: startTimeIndex + 2,
                                gridRowEnd: `span ${duration}`,
                                zIndex: 5 + (horizontalOverlapIndex || 0),
                                overflow: 'hidden',
                                position: 'relative', 
                                width: `${cardFixedWidthRem}rem`,
                                maxWidth: `${cardFixedWidthRem}rem`, 
                            };

                            if (horizontalOverlapCount > 1) {
                                dynamicStyles.left = `${horizontalOverlapIndex * cardFixedWidthRem}rem`;
                            } else {
                                dynamicStyles.left = '0rem';
                            }
                            
                            return (
                                <div
                                    key={app.id}
                                    className="bg-primary/20 p-1.5 rounded-md text-xs border border-primary/40 hover:bg-primary/30 m-0.5 shadow-sm flex flex-col"
                                    style={dynamicStyles}
                                >
                                    <div className="flex justify-between items-start mb-0.5 flex-shrink-0">
                                        <p className="font-semibold text-[hsl(var(--slot-full-foreground))] truncate font-body flex-grow mr-1">{app.name}</p>
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
                                    {app.phoneNumber && (
                                      <p className="text-muted-foreground font-body mb-0.5 flex-shrink-0 truncate">
                                        <Phone className="inline h-3 w-3 mr-1" />
                                        {app.phoneNumber}
                                      </p>
                                    )}
                                    <ScrollArea className="flex-grow" style={{ maxHeight: `calc(${cardVisualHeightInRem}rem - ${app.phoneNumber ? '4.5rem' : '3.0rem'})` }}> 
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
        </>
      )}
    </div>
  );
}
