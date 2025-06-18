
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { CalendarIcon, Clock, Users, Sparkles, CalendarPlus, UserCircle, Phone } from 'lucide-react';
import type { Service, Appointment, NewAppointment } from '@/types';
import { format, isSameDay, getHours } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import * as LucideIcons from 'lucide-react';
import { useEffect, useState } from 'react';

interface SchedulingFormProps {
  availableServices: Service[];
  timeSlots: string[];
  onAddAppointment: (data: NewAppointment) => Promise<boolean>;
  appointments: Appointment[];
}

const phoneRegex = /^\+420[0-9]{9}$/;

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.').max(50, 'Name cannot exceed 50 characters.'),
  date: z.date({ required_error: 'Please select a date.' }),
  time: z.string({ required_error: 'Please select a time.' }).min(1, 'Please select a time.'),
  services: z.array(z.string()).min(1, { message: 'Please select at least one service.' }),
  groupSize: z.coerce.number().min(1, "Group size must be at least 1.").max(3, "Group size cannot exceed 3. Combined group size for a time slot cannot exceed 6."),
  phoneNumber: z.string()
    .optional()
    .refine(val => {
      if (!val || val === '' || val === '+420') return true; 
      return phoneRegex.test(val);
    }, {
      message: "Phone number must be in the format +420 followed by 9 digits, or left blank.",
    })
    .transform(val => (val === '+420' ? '' : val)),
});

export default function SchedulingForm({ availableServices, timeSlots: allTimeSlots, onAddAppointment, appointments }: SchedulingFormProps) {
  const { toast } = useToast();
  const [filteredTimeSlots, setFilteredTimeSlots] = useState<string[]>(allTimeSlots);
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      date: undefined,
      time: '',
      services: [],
      groupSize: 1,
      phoneNumber: '+420',
    },
  });

  const watchedDate = form.watch('date');

  useEffect(() => {
    if (!watchedDate) {
      setFilteredTimeSlots([]);
      if (form.getValues('time')) {
        form.setValue('time', '', { shouldValidate: true });
      }
      return;
    }

    let currentAvailableSlots = [...allTimeSlots];

    if (isSameDay(watchedDate, new Date())) {
      const now = new Date();
      const currentHour = getHours(now);
      currentAvailableSlots = currentAvailableSlots.filter(slot => {
        const slotHour = parseInt(slot.split(':')[0]);
        return slotHour > currentHour;
      });
    }

    currentAvailableSlots = currentAvailableSlots.filter(slotToCheck => {
      let customersInThisSlot = 0;
      for (const appointment of appointments) {
        if (isSameDay(new Date(appointment.date), watchedDate)) {
          const appointmentStartTimeIndex = allTimeSlots.indexOf(appointment.time);
          if (appointmentStartTimeIndex === -1) continue;

          const appointmentDuration = appointment.services.length || 1;
          const slotToCheckIndex = allTimeSlots.indexOf(slotToCheck);
          if (slotToCheckIndex === -1) continue;

          if (slotToCheckIndex >= appointmentStartTimeIndex && slotToCheckIndex < (appointmentStartTimeIndex + appointmentDuration)) {
            customersInThisSlot += appointment.groupSize;
          }
        }
      }
      return customersInThisSlot < 6;
    });

    setFilteredTimeSlots(currentAvailableSlots);

    const currentSelectedTime = form.getValues('time');
    if (currentSelectedTime && !currentAvailableSlots.includes(currentSelectedTime)) {
      form.setValue('time', '', { shouldValidate: true });
    }

  }, [watchedDate, appointments, allTimeSlots, form]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    const submissionValues: NewAppointment = {
      name: values.name,
      date: values.date, // Date object
      time: values.time,
      services: values.services,
      groupSize: values.groupSize,
      phoneNumber: values.phoneNumber || undefined,
    };
    const success = await onAddAppointment(submissionValues);
    if (success) {
      toast({
        title: "Appointment Scheduled!",
        description: (
          <div className="font-body">
            Appointment for <span className="font-semibold">{values.name}</span> on <span className="font-semibold">{format(values.date, "EEEE, MMMM do")}</span> at <span className="font-semibold">{values.time}</span> is booked.
          </div>
        ),
        variant: "default",
      });
      form.reset({ name: '', date: undefined, time: '', services: [], groupSize: 1, phoneNumber: '+420' });
      setIsDatePopoverOpen(false);
    }
  }

  const getIcon = (iconName: keyof typeof LucideIcons | 'Default'): React.ElementType => {
    if (iconName === 'Default' || !LucideIcons[iconName]) {
      return LucideIcons.Sparkles;
    }
    return LucideIcons[iconName] as React.ElementType;
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value;
    let formattedValue = '+420';

    if (inputValue.startsWith('+420')) {
      const digits = inputValue.substring(4).replace(/[^0-9]/g, '');
      formattedValue += digits.substring(0, 9); 
    } else if (inputValue.startsWith('+')) { 
      const digits = inputValue.substring(1).replace(/[^0-9]/g, '');
      formattedValue += digits.substring(0, 9);
    }
    else { 
      const digits = inputValue.replace(/[^0-9]/g, '');
      formattedValue += digits.substring(0, 9);
    }
    
    form.setValue('phoneNumber', formattedValue, { shouldValidate: true });
  };


  return (
    <Card className="shadow-xl w-full">
      <CardHeader className="p-4">
        <CardTitle className="flex items-center text-xl font-headline">
          <CalendarPlus className="mr-2 h-5 w-5 text-primary" />
          Book Your Appointment
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold font-body flex items-center text-sm"><UserCircle className="mr-2 h-4 w-4" />Name for Appointment</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter name for the booking" {...field} className="font-body" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold font-body flex items-center text-sm"><Phone className="mr-2 h-4 w-4" />Phone Number (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      {...field} 
                      onChange={handlePhoneNumberChange} 
                      value={field.value || '+420'} // Ensure value is controlled and starts with +420
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="font-semibold font-body flex items-center text-sm"><CalendarIcon className="mr-2 h-4 w-4" />Date</FormLabel>
                  <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal font-body",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                           if (date) field.onChange(date);
                           setIsDatePopoverOpen(false); // Close popover on select
                        }}
                        disabled={(date) => date < new Date(new Date().setHours(0,0,0,0)) || date > new Date(new Date().setDate(new Date().getDate() + 90)) }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold font-body flex items-center text-sm"><Clock className="mr-2 h-4 w-4" />Time</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!watchedDate || filteredTimeSlots.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger className="font-body">
                        <SelectValue placeholder={!watchedDate ? "Select a date first" : (filteredTimeSlots.length === 0 ? "No slots available" : "Select a time slot")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredTimeSlots.map(slot => (
                        <SelectItem key={slot} value={slot} className="font-body">{slot}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="services"
              render={() => (
                <FormItem>
                  <div className="mb-1">
                    <FormLabel className="text-base font-semibold font-body flex items-center text-sm">
                      <Sparkles className="mr-2 h-4 w-4" />Services
                    </FormLabel>
                  </div>
                  {availableServices.map((service) => {
                    const IconComponent = getIcon(service.iconName);
                    return (
                    <FormField
                      key={service.id}
                      control={form.control}
                      name="services"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={service.id}
                            className="flex flex-row items-center space-x-2 space-y-0 mb-0.5 p-1.5 border rounded-md hover:bg-accent/50 transition-colors"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(service.id)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...(field.value || []), service.id])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value) => value !== service.id
                                        )
                                      )
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal font-body text-sm flex items-center cursor-pointer w-full">
                              <IconComponent className="mr-2 h-4 w-4 text-primary" />
                              {service.name}
                            </FormLabel>
                          </FormItem>
                        )
                      }}
                    />
                  )})}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="groupSize"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold font-body flex items-center text-sm"><Users className="mr-2 h-4 w-4" />Group Size</FormLabel>
                  <Select onValueChange={(value) => field.onChange(parseInt(value))} value={String(field.value)}>
                    <FormControl>
                      <SelectTrigger className="font-body">
                        <SelectValue placeholder="Select number of people" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[1, 2, 3].map(num => (
                        <SelectItem key={num} value={String(num)} className="font-body">{num} person{num > 1 ? 's' : ''}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full font-body text-sm py-2.5">Book Appointment</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
