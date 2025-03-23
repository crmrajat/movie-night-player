"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { CalendarIcon, Check, UserPlus } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Movie, ScheduledMovie } from "@/lib/types"
import { scheduleSchema, type ScheduleFormValues } from "@/lib/schemas"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { ScrollArea } from "@/components/ui/scroll-area"

// Custom date formatter function to avoid date-fns dependency
function formatDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }
  return date.toLocaleDateString("en-US", options)
}

interface ScheduleViewingProps {
  movies: Movie[]
  scheduledMovies: ScheduledMovie[]
  onScheduleMovie: (movieId: string, date: Date) => void
  onMarkAvailability: (movieId: string, name: string) => void
}

export default function ScheduleViewing({
  movies,
  scheduledMovies,
  onScheduleMovie,
  onMarkAvailability,
}: ScheduleViewingProps) {
  const [open, setOpen] = useState(false)
  const [attendeeName, setAttendeeName] = useState("")
  const [selectedScheduledMovie, setSelectedScheduledMovie] = useState<string | null>(null)

  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      movieId: "",
    },
  })

  const onSubmit = (values: ScheduleFormValues) => {
    onScheduleMovie(values.movieId, values.date)
    form.reset()
    setOpen(false)
  }

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      form.reset()
    }
    setOpen(open)
  }

  const handleMarkAvailability = (movieId: string) => {
    if (attendeeName.trim()) {
      onMarkAvailability(movieId, attendeeName.trim())
      setAttendeeName("")
      setSelectedScheduledMovie(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Schedule & Availability</h2>
        <Dialog open={open} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger asChild>
            <Button>Schedule Movie Night</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Schedule a Movie Night</DialogTitle>
              <DialogDescription>Pick a movie and set a date for viewing</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="movieId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Movie</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a movie" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {movies.map((movie) => (
                            <SelectItem key={movie.id} value={movie.id}>
                              {movie.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground",
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? formatDate(field.value) : "Pick a date"}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                            disabled={(date) => date < new Date()}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit">Schedule</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Upcoming Movie Nights</h3>
        {scheduledMovies.length === 0 ? (
          <p className="text-muted-foreground">No movie nights scheduled yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scheduledMovies.map((scheduled) => {
              const movie = movies.find((m) => m.id === scheduled.movieId)
              if (!movie) return null

              return (
                <Card key={`${scheduled.movieId}-${scheduled.date.toISOString()}`} className="flex flex-col h-[350px]">
                  <CardHeader>
                    <CardTitle className="truncate">{movie.title}</CardTitle>
                    <CardDescription>{formatDate(scheduled.date)}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="space-y-2 h-[150px]">
                      <div className="font-bold">Attendees ({scheduled.attendees.length})</div>
                      <div className="h-[120px]">
                        {scheduled.attendees.length > 0 ? (
                          <ScrollArea className="h-full pr-4">
                            <ul className="space-y-2">
                              {scheduled.attendees.map((name, index) => (
                                <li key={index} className="flex items-center space-x-2">
                                  <span className="h-1.5 w-1.5 bg-foreground rounded-full flex-shrink-0" />
                                  <span className="truncate">{name}</span>
                                </li>
                              ))}
                            </ul>
                          </ScrollArea>
                        ) : (
                          <p className="text-sm text-muted-foreground">No attendees yet</p>
                        )}
                      </div>
                    </div>

                    {selectedScheduledMovie === scheduled.movieId ? (
                      <div className="mt-4">
                        <div className="flex gap-2">
                          <Input
                            value={attendeeName}
                            onChange={(e) => setAttendeeName(e.target.value)}
                            placeholder="Your name"
                            className="flex-1"
                          />
                          <Button
                            size="icon"
                            onClick={() => handleMarkAvailability(scheduled.movieId)}
                            disabled={!attendeeName.trim()}
                            className="hover:bg-blue-100 hover:text-blue-700 hover:border-blue-300 transition-colors"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </CardContent>
                  <CardFooter className="mt-auto">
                    {selectedScheduledMovie !== scheduled.movieId && (
                      <Button
                        variant="outline"
                        className="w-full hover:bg-blue-100 hover:text-blue-700 hover:border-blue-300 transition-colors"
                        onClick={() => setSelectedScheduledMovie(scheduled.movieId)}
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        Mark Availability
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

