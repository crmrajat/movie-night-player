"use client"

import type React from "react"

import { useState, useCallback, memo, type KeyboardEvent, useMemo, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { z } from "zod"
import { useToast } from "@/components/ui/use-toast"
import type { Movie, MovieNight, Attendee } from "@/lib/types"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  CalendarIcon,
  Users,
  PlusCircle,
  CheckCircle2,
  X,
  CalendarPlus2Icon as CalendarIcon2,
  Trash,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const scheduleSchema = z.object({
  movieId: z.string().min(1, "Please select a movie"),
  date: z.date({
    required_error: "Please select a date",
  }),
})

type ScheduleFormValues = z.infer<typeof scheduleSchema>

// Empty state component for when there are no attendees
const NoAttendees = memo(() => (
  <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
    <p>No attendees yet</p>
    <p className="text-sm">Add attendees using the form below</p>
  </div>
))

NoAttendees.displayName = "NoAttendees"

// Empty state component for when there are no movie nights
const NoMovieNights = memo(() => (
  <div className="col-span-full flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
    <CalendarIcon2 className="h-16 w-16 mb-4 opacity-20" />
    <h3 className="text-xl font-medium mb-2">No movie nights scheduled</h3>
    <p className="max-w-md mb-6">
      Schedule your first movie night by selecting a movie and date. Make sure you've added some movies first.
    </p>
  </div>
))

NoMovieNights.displayName = "NoMovieNights"

// Optimized AttendeeList component with virtualization for large lists
const AttendeeList = memo(
  ({
    attendees,
    onRemoveAttendee,
  }: {
    attendees: Attendee[]
    onRemoveAttendee: (attendeeId: string) => void
  }) => {
    const [attendeeToRemove, setAttendeeToRemove] = useState<string | null>(null)

    const handleRemoveClick = useCallback((attendeeId: string) => {
      setAttendeeToRemove(attendeeId)
    }, [])

    const handleConfirmRemove = useCallback(() => {
      if (attendeeToRemove) {
        onRemoveAttendee(attendeeToRemove)
        setAttendeeToRemove(null)
      }
    }, [attendeeToRemove, onRemoveAttendee])

    const handleCancelRemove = useCallback(() => {
      setAttendeeToRemove(null)
    }, [])

    // Only render visible items for better performance with large lists
    const visibleAttendees = useMemo(() => {
      return attendees.slice(0, 50) // Limit to first 50 for performance
    }, [attendees])

    // Render content based on whether there are attendees
    const content =
      attendees.length === 0 ? (
        <NoAttendees />
      ) : (
        <ul className="mt-2 space-y-1 overflow-y-auto flex-1 pr-1">
          {visibleAttendees.map((attendee) => (
            <li key={attendee.id} className="flex items-center justify-between gap-2 group">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span>{attendee.name}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleRemoveClick(attendee.id)}
              >
                <X className="h-4 w-4 text-red-500" />
              </Button>
            </li>
          ))}
          {attendees.length > 50 && (
            <li className="text-sm text-muted-foreground pt-1">+ {attendees.length - 50} more attendees</li>
          )}
        </ul>
      )

    return (
      <>
        {content}
        <AlertDialog open={attendeeToRemove !== null} onOpenChange={(open) => !open && setAttendeeToRemove(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Attendee</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove this attendee? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleCancelRemove}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmRemove} className="bg-red-500 hover:bg-red-600">
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    )
  },
)

AttendeeList.displayName = "AttendeeList"

// Optimized AddAttendeeForm component
const AddAttendeeForm = memo(
  ({
    onAddAttendee,
    nightId,
  }: {
    onAddAttendee: (nightId: string, name: string) => void
    nightId: string
  }) => {
    const [newAttendee, setNewAttendee] = useState("")
    const [error, setError] = useState("")
    const inputRef = useRef<HTMLInputElement>(null)

    const handleAddAttendee = useCallback(() => {
      if (!newAttendee.trim()) {
        setError("Please enter a name")
        return
      }

      onAddAttendee(nightId, newAttendee.trim())
      setNewAttendee("")
      setError("")

      // Focus the input after adding for quick consecutive additions
      if (inputRef.current) {
        inputRef.current.focus()
      }
    }, [newAttendee, nightId, onAddAttendee])

    const handleKeyDown = useCallback(
      (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
          e.preventDefault()
          handleAddAttendee()
        }
      },
      [handleAddAttendee],
    )

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewAttendee(e.target.value)
        if (error) setError("")
      },
      [error],
    )

    const clearInput = useCallback(() => {
      setNewAttendee("")
    }, [])

    return (
      <div className="w-full space-y-2">
        <div className="flex gap-2 w-full">
          <div className="relative flex-1">
            <Input
              ref={inputRef}
              placeholder="Enter name"
              value={newAttendee}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              maxLength={30}
              className="pr-8"
            />
            {newAttendee && (
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={clearInput}
                type="button"
                aria-label="Clear input"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button onClick={handleAddAttendee} className="flex-shrink-0">
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Attendee
          </Button>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    )
  },
)

AddAttendeeForm.displayName = "AddAttendeeForm"

// Optimized MovieNightCard component
const MovieNightCard = memo(
  ({
    night,
    movie,
    onAddAttendee,
    onRemoveAttendee,
    onRemoveNight,
  }: {
    night: MovieNight
    movie: Movie | undefined
    onAddAttendee: (nightId: string, name: string) => void
    onRemoveAttendee: (nightId: string, attendeeId: string) => void
    onRemoveNight: (nightId: string) => void
  }) => {
    if (!movie) return null

    // Memoize formatted date to prevent recalculation
    const formattedDate = useMemo(() => format(night.date, "EEEE, MMMM d, yyyy"), [night.date])

    // Use the direct count instead of memoizing for real-time updates
    const attendeeCount = night.attendees.length

    const handleRemoveAttendee = useCallback(
      (attendeeId: string) => {
        onRemoveAttendee(night.id, attendeeId)
      },
      [night.id, onRemoveAttendee],
    )

    return (
      <Card className="overflow-hidden h-[350px] flex flex-col">
        <CardContent className="p-6 flex-1 overflow-hidden flex flex-col">
          <div className="flex justify-between items-start">
            <div className="overflow-hidden">
              <h3 className="text-xl font-bold">{movie.title}</h3>
              <p className="text-gray-600 dark:text-gray-300 mt-1">{formattedDate}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-500 hover:text-red-700"
              onClick={() => onRemoveNight(night.id)}
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-4 flex-1 overflow-hidden flex flex-col">
            <h4 className="font-medium flex items-center gap-1">
              <Users className="h-4 w-4" />
              Attendees ({attendeeCount})
            </h4>
            <AttendeeList attendees={night.attendees} onRemoveAttendee={handleRemoveAttendee} />
          </div>
        </CardContent>
        <CardFooter className="border-t p-4">
          <AddAttendeeForm onAddAttendee={onAddAttendee} nightId={night.id} />
        </CardFooter>
      </Card>
    )
  },
)

MovieNightCard.displayName = "MovieNightCard"

interface ScheduleAvailabilityProps {
  movies: Movie[]
  movieNights: MovieNight[]
  onSchedule: (movieId: string, date: Date) => void
  onToggleAttendance: (movieNightId: string, attendeeId: string) => void
  setMovieNights: (nights: MovieNight[]) => void
  onRemoveMovieNight: (nightId: string) => void
}

export function ScheduleAvailability({
  movies,
  movieNights,
  onSchedule,
  onToggleAttendance,
  setMovieNights,
  onRemoveMovieNight,
}: ScheduleAvailabilityProps) {
  const [open, setOpen] = useState(false)
  const { toast } = useToast()

  // Use state instead of ref for real-time updates
  const [localMovieNights, setLocalMovieNights] = useState<MovieNight[]>(movieNights)

  // Keep local state in sync with props
  useEffect(() => {
    setLocalMovieNights(movieNights)
  }, [movieNights])

  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      movieId: "",
    },
  })

  const onSubmit = useCallback(
    (data: ScheduleFormValues) => {
      onSchedule(data.movieId, data.date)
      setOpen(false)
      form.reset()
      toast({
        title: "Movie night scheduled",
        description: `Movie night has been scheduled for ${format(data.date, "EEEE, MMMM d, yyyy")}`,
      })
    },
    [onSchedule, setOpen, form, toast],
  )

  // Memoize getMovieById function with useCallback
  const getMovieById = useCallback(
    (id: string) => {
      return movies.find((movie) => movie.id === id)
    },
    [movies],
  )

  const handleAddAttendee = useCallback(
    (nightId: string, name: string) => {
      // Check for duplicates (case insensitive)
      const night = localMovieNights.find((n) => n.id === nightId)
      if (!night) return

      if (night.attendees.some((a) => a.name.toLowerCase() === name.toLowerCase())) {
        toast({
          title: "Duplicate attendee",
          description: `${name} is already in the attendee list`,
          variant: "destructive",
        })
        return
      }

      // Create a new attendee
      const newAttendee = {
        id: Date.now().toString(),
        name: name,
        isAttending: true,
      }

      // Create updated movie nights array with the new attendee
      const updatedNights = localMovieNights.map((n) => {
        if (n.id === nightId) {
          return {
            ...n,
            attendees: [...n.attendees, newAttendee],
          }
        }
        return n
      })

      // Update local state immediately for real-time updates
      setLocalMovieNights(updatedNights)

      // Also update the parent state
      setMovieNights(updatedNights)

      toast({
        title: "Attendee added",
        description: `${name} has been added to the attendee list`,
      })
    },
    [localMovieNights, toast, setMovieNights],
  )

  const handleRemoveAttendee = useCallback(
    (nightId: string, attendeeId: string) => {
      // Create updated movie nights array without the removed attendee
      const updatedNights = localMovieNights.map((n) => {
        if (n.id === nightId) {
          return {
            ...n,
            attendees: n.attendees.filter((a) => a.id !== attendeeId),
          }
        }
        return n
      })

      // Update local state immediately for real-time updates
      setLocalMovieNights(updatedNights)

      // Also update the parent state
      setMovieNights(updatedNights)

      toast({
        title: "Attendee removed",
        description: "The attendee has been removed from the list",
      })
    },
    [localMovieNights, toast, setMovieNights],
  )

  // Memoize the movie options to prevent unnecessary re-renders
  const movieOptions = useMemo(
    () =>
      movies.map((movie) => (
        <SelectItem key={movie.id} value={movie.id}>
          {movie.title}
        </SelectItem>
      )),
    [movies],
  )

  // Memoize the movie night cards with the local state
  const hasMovies = movies.length > 0

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [nightToDelete, setNightToDelete] = useState<string | null>(null)

  const handleRemoveNight = useCallback((id: string) => {
    setNightToDelete(id)
    setDeleteConfirmOpen(true)
  }, [])

  const confirmRemoveNight = useCallback(() => {
    if (nightToDelete) {
      onRemoveMovieNight(nightToDelete)
      setNightToDelete(null)
      setDeleteConfirmOpen(false)
      toast({
        title: "Movie night deleted",
        description: "The movie night has been removed from the schedule",
      })
    }
  }, [nightToDelete, onRemoveMovieNight, toast])

  const noMovieNightsComponent = useMemo(() => <NoMovieNights />, [])

  const movieNightCards = useMemo(() => {
    return localMovieNights.map((night) => (
      <MovieNightCard
        key={night.id}
        night={night}
        movie={getMovieById(night.movieId)}
        onAddAttendee={handleAddAttendee}
        onRemoveAttendee={handleRemoveAttendee}
        onRemoveNight={handleRemoveNight}
      />
    ))
  }, [localMovieNights, getMovieById, handleAddAttendee, handleRemoveAttendee, handleRemoveNight])

  const handleOpenDialog = useCallback(() => {
    setOpen(true)
  }, [])

  const hasMovieNights = localMovieNights.length > 0

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center py-4">
        <h2 className="text-2xl font-bold">Schedule</h2>
        <Button onClick={handleOpenDialog} disabled={!hasMovies}>
          Schedule Movie Night
        </Button>
      </div>

      <div>
        <h3 className="text-xl font-bold mb-4">Upcoming Movie Nights</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {hasMovieNights ? movieNightCards : noMovieNightsComponent}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule a Movie Night</DialogTitle>
            <DialogDescription>Pick a movie and set a date for viewing</DialogDescription>
          </DialogHeader>

          {!hasMovies ? (
            <div className="py-4 text-center">
              <p className="text-muted-foreground mb-4">
                You need to add some movies before you can schedule a movie night.
              </p>
              <DialogClose asChild>
                <Button>Close</Button>
              </DialogClose>
            </div>
          ) : (
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
                        <SelectContent>{movieOptions}</SelectContent>
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
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground",
                              )}
                            >
                              {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <DialogClose asChild>
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button type="submit">Schedule</Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Movie Night</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this movie night? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemoveNight} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

