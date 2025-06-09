
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { CalendarIcon, Clock, Users, Sparkles, CalendarPlus, UserCircle } from 'lucide-react';
import type { Service, Appointment } from '@/types';
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import * as LucideIcons from 'lucide-react';

interface SchedulingFormProps {
  availableServices: Service[];
  timeSlots: string[];
  onAddAppointment: (data: Omit<Appointment, 'id'>) => boolean; // Returns true on success, false on failure (e.g. limit reached)
}

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.').max(50, 'Name cannot exceed 50 characters.'),
  date: z.date({ required_error: 'Please select a date.' }),
  time: z.string({ required_error: 'Please select a time.' }).min(1, 'Please select a time.'),
  services: z.array(z.string()).min(1, { message: 'Please select at least one service.' }),
  groupSize: z.coerce.number().min(1, "Group size must be at least 1.").max(3, "Group size cannot exceed 3. Combined group size for a time slot cannot exceed 6."),
});

export default function SchedulingForm({ availableServices, timeSlots, onAddAppointment }: SchedulingFormProps) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      date: undefined,
      time: '',
      services: [],
      groupSize: 1,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const success = onAddAppointment(values);
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
      form.reset({ name: '', date: undefined, time: '', services: [], groupSize: 1 });
    }
    // If not successful, the toast is handled by onAddAppointment in page.tsx
  }

  const getIcon = (iconName: keyof typeof LucideIcons | 'Default'): React.ElementType => {
    if (iconName === 'Default' || !LucideIcons[iconName]) {
      return LucideIcons.Sparkles;
    }
    return LucideIcons[iconName] as React.ElementType;
  };


  return (
    <Card className="shadow-xl w-full">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl font-headline">
          <CalendarPlus className="mr-2 h-6 w-6 text-primary" />
          Book Your Appointment
        </CardTitle>
        <CardDescription className="font-body">Fill in the details below to schedule your glam session.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold font-body flex items-center"><UserCircle className="mr-2 h-4 w-4" />Name for Appointment</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter name for the booking" {...field} className="font-body" />
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
                  <FormLabel className="font-semibold font-body flex items-center"><CalendarIcon className="mr-2 h-4 w-4" />Date</FormLabel>
                  <Popover>
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
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date(new Date().setHours(0,0,0,0)) || date > new Date(new Date().setDate(new Date().getDate() + 90)) } // Disable past dates and dates more than 90 days in future
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
                  <FormLabel className="font-semibold font-body flex items-center"><Clock className="mr-2 h-4 w-4" />Time</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="font-body">
                        <SelectValue placeholder="Select a time slot" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {timeSlots.map(slot => (
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
                  <div className="mb-4">
                    <FormLabel className="text-base font-semibold font-body flex items-center">
                      <Sparkles className="mr-2 h-4 w-4" />Services
                    </FormLabel>
                    <FormDescription className="font-body">
                      Select all services you'd like to book.
                    </FormDescription>
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
                            className="flex flex-row items-center space-x-3 space-y-0 mb-2 p-3 border rounded-md hover:bg-accent/50 transition-colors"
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
                            <FormLabel className="font-normal font-body flex items-center cursor-pointer w-full">
                              <IconComponent className="mr-2 h-5 w-5 text-primary" />
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
                  <FormLabel className="font-semibold font-body flex items-center"><Users className="mr-2 h-4 w-4" />Group Size (max 3 per booking)</FormLabel>
                  <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={String(field.value)} value={String(field.value)}>
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
                  <FormDescription className="font-body">Total customers for any time slot cannot exceed 6.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full font-body text-lg py-6">Book Appointment</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
