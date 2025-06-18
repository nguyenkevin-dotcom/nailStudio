
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Appointment, Service, NewAppointment } from '@/types';
import Header from '@/components/Header';
import SchedulingForm from '@/components/SchedulingForm';
import AppointmentCalendar from '@/components/AppointmentCalendar';
import { Button } from '@/components/ui/button';
import { ArrowUpCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { format, isSameDay } from 'date-fns';

const availableServices: Service[] = [
  { id: 'hands', name: 'Nails (Hands)', iconName: 'Hand' },
  { id: 'feet', name: 'Nails (Feet)', iconName: 'Footprints' },
  { id: 'eyelashes', name: 'Eyelashes', iconName: 'Eye' },
];

const timeSlots = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
];

export default function HomePage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [calendarView, setCalendarView] = useState<'week' | 'day'>('week');
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  const fetchAppointments = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/appointments');
      if (!response.ok) {
        throw new Error('Failed to fetch appointments');
      }
      const data: Appointment[] = await response.json();
      // Ensure dates are Date objects
      const parsedAppointments = data.map(app => ({
        ...app,
        date: new Date(app.date),
      }));
      // Sort appointments after fetching
      parsedAppointments.sort((a, b) => {
          const dateComparison = a.date.getTime() - b.date.getTime();
          if (dateComparison !== 0) return dateComparison;
          return timeSlots.indexOf(a.time) - timeSlots.indexOf(b.time);
        });
      setAppointments(parsedAppointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast({
        title: "Error",
        description: "Could not load appointments from the server.",
        variant: "destructive",
      });
      setAppointments([]); // Clear appointments on error
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAppointments();
    if (!selectedDate) {
        setSelectedDate(new Date()); 
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchAppointments]); // fetchAppointments is memoized with useCallback


  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isSlotOccupiedByAppointment = (appointment: Appointment, slotToCheck: string, allTimeSlots: string[]): boolean => {
    const appointmentStartTimeIndex = allTimeSlots.indexOf(appointment.time);
    if (appointmentStartTimeIndex === -1) return false;

    const appointmentDuration = appointment.services.length || 1;
    const slotToCheckIndex = allTimeSlots.indexOf(slotToCheck);
    if (slotToCheckIndex === -1) return false;

    return slotToCheckIndex >= appointmentStartTimeIndex && slotToCheckIndex < (appointmentStartTimeIndex + appointmentDuration);
  };

  const addAppointment = async (newAppointmentData: NewAppointment) => {
    const appointmentDuration = newAppointmentData.services.length || 1;
    if (appointmentDuration === 0) {
      toast({
        title: "No Services Selected",
        description: "Please select at least one service to book an appointment.",
        variant: "destructive",
      });
      return false;
    }

    const newAppointmentStartTimeIndex = timeSlots.indexOf(newAppointmentData.time);
    if (newAppointmentStartTimeIndex === -1) {
        toast({
            title: "Invalid Time",
            description: "The selected starting time slot is not valid.",
            variant: "destructive",
        });
        return false;
    }

    if (newAppointmentStartTimeIndex + appointmentDuration > timeSlots.length) {
        toast({
            title: "Booking Too Long",
            description: (
              <div className="font-body">
                This {appointmentDuration}-hour appointment starting at {newAppointmentData.time} on <span className="font-semibold">{format(newAppointmentData.date, "MMMM do")}</span> extends beyond available service hours.
              </div>
            ),
            variant: "destructive",
        });
        return false;
    }

    const occupiedSlotsByNewAppointment: string[] = [];
    for (let i = 0; i < appointmentDuration; i++) {
        occupiedSlotsByNewAppointment.push(timeSlots[newAppointmentStartTimeIndex + i]);
    }

    for (const slot of occupiedSlotsByNewAppointment) {
        const appointmentsOnSameDateAtSlot = appointments.filter(
            app =>
                isSameDay(new Date(app.date), newAppointmentData.date) &&
                isSlotOccupiedByAppointment(app, slot, timeSlots)
        );

        const existingCustomersAtSlot = appointmentsOnSameDateAtSlot.reduce((sum, app) => sum + app.groupSize, 0);

        if (existingCustomersAtSlot + newAppointmentData.groupSize > 6) {
            toast({
                title: "Booking Limit Reached",
                description: (
                    <div className="font-body">
                        The time slot <span className="font-semibold">{slot}</span> on <span className="font-semibold">{format(newAppointmentData.date, "MMMM do")}</span> cannot accommodate an additional group of {newAppointmentData.groupSize}.
                        Maximum 6 customers allowed. Currently {existingCustomersAtSlot} customer(s) booked in this slot.
                    </div>
                ),
                variant: "destructive",
            });
            return false;
        }
    }
    
    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Send date as ISO string for backend processing
        body: JSON.stringify({...newAppointmentData, date: newAppointmentData.date.toISOString()}),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create appointment');
      }
      
      // const createdAppointment: Appointment = await response.json();
      await fetchAppointments(); // Re-fetch all appointments to update the list
      return true;

    } catch (error) {
      console.error("Error adding appointment:", error);
      toast({
        title: "Error Creating Appointment",
        description: (error as Error).message || "Could not save the appointment.",
        variant: "destructive",
      });
      return false;
    }
  };


  const deleteAppointment = async (appointmentId: number) => {
    const appointmentToDelete = appointments.find(app => app.id === appointmentId);
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete appointment');
      }
      
      await fetchAppointments(); // Re-fetch all appointments to update the list

      if (appointmentToDelete) {
        toast({
          title: "Appointment Canceled",
          description: (
            <div className="font-body">
              Appointment for <span className="font-semibold">{appointmentToDelete.name}</span> on <span className="font-semibold">{format(appointmentToDelete.date, "EEEE, MMMM do")}</span> at <span className="font-semibold">{appointmentToDelete.time}</span> has been canceled.
            </div>
          ),
          variant: "destructive", // Keep destructive for cancellation feedback
        });
      }

    } catch (error) {
      console.error("Error deleting appointment:", error);
      toast({
        title: "Error Deleting Appointment",
        description: (error as Error).message || "Could not delete the appointment.",
        variant: "destructive",
      });
    }
  };

  const handleCalendarDayClick = (day: Date) => {
    setSelectedDate(day);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading && appointments.length === 0) {
    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
            <Header />
            <main className="flex-grow container mx-auto p-4 md:p-6 lg:p-8 flex justify-center items-center">
                <p className="text-xl font-semibold">Loading appointments...</p>
            </main>
            <footer className="text-center p-6 text-sm text-muted-foreground border-t border-border font-body">
                Nehtové studio Lenka Šumperk &copy; {new Date().getFullYear()} - Your Beauty, Scheduled.
            </footer>
        </div>
    );
  }


  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8 items-start">
          <section className="lg:col-span-1 lg:sticky lg:top-24">
            <SchedulingForm
              availableServices={availableServices}
              timeSlots={timeSlots}
              onAddAppointment={addAppointment}
              appointments={appointments}
            />
          </section>
          <section className="lg:col-span-3">
            <AppointmentCalendar
              appointments={appointments}
              availableServices={availableServices}
              onCalendarDayClick={handleCalendarDayClick}
              selectedDate={selectedDate}
              onDeleteAppointment={deleteAppointment}
              timeSlots={timeSlots}
              calendarView={calendarView}
              onCalendarViewChange={setCalendarView}
            />
          </section>
        </div>
      </main>
      <footer className="text-center p-6 text-sm text-muted-foreground border-t border-border font-body">
        Nehtové studio Lenka Šumperk &copy; {new Date().getFullYear()} - Your Beauty, Scheduled.
      </footer>
      {showScrollTop && (
         <Button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 rounded-full p-3 h-12 w-12 shadow-lg"
          variant="default"
          aria-label="Scroll to top"
        >
          <ArrowUpCircle className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
}
