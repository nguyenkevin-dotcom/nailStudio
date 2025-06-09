'use client';

import { useState, useEffect } from 'react';
import type { Appointment, Service } from '@/types';
import Header from '@/components/Header';
import SchedulingForm from '@/components/SchedulingForm';
import AppointmentCalendar from '@/components/AppointmentCalendar';
import { Button } from '@/components/ui/button';
import { ArrowUpCircle } from 'lucide-react';

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
  const [selectedDateAppointments, setSelectedDateAppointments] = useState<Appointment[]>([]);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    // Load appointments from local storage if available
    const storedAppointments = localStorage.getItem('glamBookAppointments');
    if (storedAppointments) {
      try {
        const parsedAppointments = JSON.parse(storedAppointments).map((app: any) => ({
          ...app,
          date: new Date(app.date), // Ensure date is a Date object
        }));
        setAppointments(parsedAppointments);
      } catch (error) {
        console.error("Error parsing appointments from local storage:", error);
        localStorage.removeItem('glamBookAppointments'); // Clear corrupted data
      }
    }
  }, []);

  useEffect(() => {
    // Save appointments to local storage whenever they change
    localStorage.setItem('glamBookAppointments', JSON.stringify(appointments));
  }, [appointments]);
  

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


  const addAppointment = (newAppointmentData: Omit<Appointment, 'id'>) => {
    const newId = Date.now().toString() + Math.random().toString(36).substring(2, 7);
    const appointmentWithId = { ...newAppointmentData, id: newId };
    setAppointments(prev => {
      const updatedAppointments = [...prev, appointmentWithId];
      updatedAppointments.sort((a, b) => a.date.getTime() - b.date.getTime() || a.time.localeCompare(b.time));
      return updatedAppointments;
    });
  };

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    const appsOnDay = appointments.filter(app => 
      app.date.getFullYear() === day.getFullYear() &&
      app.date.getMonth() === day.getMonth() &&
      app.date.getDate() === day.getDate()
    ).sort((a,b) => a.time.localeCompare(b.time));
    setSelectedDateAppointments(appsOnDay);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
          <section className="lg:col-span-1 lg:sticky lg:top-24"> {/* Sticky form on larger screens */}
            <SchedulingForm
              availableServices={availableServices}
              timeSlots={timeSlots}
              onAddAppointment={addAppointment}
            />
          </section>
          <section className="lg:col-span-2">
            <AppointmentCalendar
              appointments={appointments}
              availableServices={availableServices}
              onDayClick={handleDayClick}
              selectedDateAppointments={selectedDateAppointments}
              selectedDate={selectedDate}
            />
          </section>
        </div>
      </main>
      <footer className="text-center p-6 text-sm text-muted-foreground border-t border-border font-body">
        GlamBook &copy; {new Date().getFullYear()} - Your Beauty, Scheduled.
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
