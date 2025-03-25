"use client"

import { useState, useCallback, lazy, Suspense, useMemo } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ThemeProvider } from "@/components/theme-provider"
import { SonnerToastProvider } from "@/components/sonner-toast-provider"
import type { Movie, MovieNight } from "@/lib/types"
import { toast } from "sonner"
import { format } from "date-fns"

// Use lazy loading for components with explicit chunk names for better caching
const MovieSuggestions = lazy(() =>
  import("@/components/movie-suggestions").then((mod) => ({ default: mod.MovieSuggestions })),
)
const ScheduleAvailability = lazy(() =>
  import("@/components/schedule-availability").then((mod) => ({ default: mod.ScheduleAvailability })),
)

// Loading fallbacks
const MovieSuggestionsFallback = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="h-[250px] bg-gray-200 dark:bg-gray-700 rounded"></div>
      <div className="h-[250px] bg-gray-200 dark:bg-gray-700 rounded"></div>
    </div>
  </div>
)

const ScheduleAvailabilityFallback = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="h-[350px] bg-gray-200 dark:bg-gray-700 rounded"></div>
      <div className="h-[350px] bg-gray-200 dark:bg-gray-700 rounded"></div>
    </div>
  </div>
)

export default function MovieNightPlanner() {
  // Start with empty arrays instead of hardcoded data
  const [movies, setMovies] = useState<Movie[]>([])
  const [movieNights, setMovieNights] = useState<MovieNight[]>([])
  const [deletedMovies, setDeletedMovies] = useState<Movie[]>([])
  const [deletedMovieNights, setDeletedMovieNights] = useState<MovieNight[]>([])

  // Use useCallback to memoize callback functions
  const addMovie = useCallback((movie: Omit<Movie, "id" | "votes" | "userVote">) => {
    const newMovie: Movie = {
      id: Date.now().toString(),
      ...movie,
      votes: { up: 0, down: 0 },
      userVote: null,
    }
    setMovies((prev) => [...prev, newMovie])
    toast.success(`"${movie.title}" has been added to suggestions`)
  }, [])

  const voteMovie = useCallback((id: string, voteType: "up" | "down" | null) => {
    setMovies((prev) =>
      prev.map((movie) => {
        if (movie.id === id) {
          // Calculate new vote counts based on previous vote and new vote
          let upVotes = movie.votes.up
          let downVotes = movie.votes.down

          // Remove previous vote if exists
          if (movie.userVote === "up") upVotes--
          if (movie.userVote === "down") downVotes--

          // Add new vote if not null
          if (voteType === "up") upVotes++
          if (voteType === "down") downVotes++

          // Show appropriate toast
          if (voteType === null) {
            if (movie.userVote === "up") {
              toast(`You removed your vote for "${movie.title}"`)
            } else if (movie.userVote === "down") {
              toast(`You removed your vote against "${movie.title}"`)
            }
          } else {
            toast.success(`You voted ${voteType === "up" ? "for" : "against"} "${movie.title}"`)
          }

          return {
            ...movie,
            votes: { up: upVotes, down: downVotes },
            userVote: voteType,
          }
        }
        return movie
      }),
    )
  }, [])

  const scheduleMovieNight = useCallback(
    (movieId: string, date: Date) => {
      const newMovieNight: MovieNight = {
        id: Date.now().toString(),
        movieId,
        date,
        attendees: [], // Start with an empty attendees array
      }
      // Use the functional update form to ensure we're working with the latest state
      setMovieNights((prev) => [...prev, newMovieNight])

      // Get movie title for the toast
      const movie = movies.find((m) => m.id === movieId)
      toast.success(
        `Movie night scheduled for ${format(date, "EEEE, MMMM d, yyyy")}${movie ? ` with "${movie.title}"` : ""}`,
      )
    },
    [movies],
  )

  const toggleAttendance = useCallback((movieNightId: string, attendeeId: string) => {
    setMovieNights((prev) =>
      prev.map((night) => {
        if (night.id === movieNightId) {
          return {
            ...night,
            attendees: night.attendees.map((attendee) => {
              if (attendee.id === attendeeId) {
                return {
                  ...attendee,
                  isAttending: !attendee.isAttending,
                }
              }
              return attendee
            }),
          }
        }
        return night
      }),
    )
  }, [])

  // Add a function to delete a movie with undo functionality:
  const deleteMovie = useCallback(
    (id: string) => {
      // Find the movie to delete
      const movieToDelete = movies.find((movie) => movie.id === id)
      if (!movieToDelete) return

      // Find any movie nights that reference this movie
      const nightsToDelete = movieNights.filter((night) => night.movieId === id)

      // Remove the movie
      setMovies((prev) => prev.filter((movie) => movie.id !== id))

      // Also remove any movie nights that reference this movie
      if (nightsToDelete.length > 0) {
        setMovieNights((prev) => prev.filter((night) => night.movieId !== id))
      }

      // Store deleted items for potential undo
      setDeletedMovies((prev) => [...prev, movieToDelete])
      if (nightsToDelete.length > 0) {
        setDeletedMovieNights((prev) => [...prev, ...nightsToDelete])
      }

      // Show toast with undo button
      toast.error(`"${movieToDelete.title}" has been deleted`, {
        action: {
          label: "Undo",
          onClick: () => {
            // Restore the movie
            setMovies((prev) => [...prev, movieToDelete])

            // Restore any deleted movie nights
            if (nightsToDelete.length > 0) {
              setMovieNights((prev) => [...prev, ...nightsToDelete])
            }

            // Remove from deleted items storage
            setDeletedMovies((prev) => prev.filter((m) => m.id !== movieToDelete.id))
            if (nightsToDelete.length > 0) {
              setDeletedMovieNights((prev) =>
                prev.filter((n) => !nightsToDelete.some((deleted) => deleted.id === n.id)),
              )
            }

            // Show success toast for undo
            toast.success(`"${movieToDelete.title}" has been restored`)
          },
        },
        duration: 5000, // 5 seconds to undo
      })
    },
    [movies, movieNights],
  )

  // Add a function to remove a movie night with undo functionality:
  const removeMovieNight = useCallback(
    (id: string) => {
      // Find the movie night to delete
      const nightToDelete = movieNights.find((night) => night.id === id)
      if (!nightToDelete) return

      // Find the associated movie for the toast message
      const movie = movies.find((m) => m.id === nightToDelete.movieId)
      const movieTitle = movie ? movie.title : "Movie night"

      // Remove the movie night
      setMovieNights((prev) => prev.filter((night) => night.id !== id))

      // Store deleted item for potential undo
      setDeletedMovieNights((prev) => [...prev, nightToDelete])

      // Show toast with undo button
      toast.error(`${movieTitle} night has been deleted`, {
        action: {
          label: "Undo",
          onClick: () => {
            // Restore the movie night
            setMovieNights((prev) => [...prev, nightToDelete])

            // Remove from deleted items storage
            setDeletedMovieNights((prev) => prev.filter((n) => n.id !== nightToDelete.id))

            // Show success toast for undo
            toast.success(`${movieTitle} night has been restored`)
          },
        },
        duration: 5000, // 5 seconds to undo
      })
    },
    [movies, movieNights],
  )

  // Memoize props for child components to prevent unnecessary re-renders
  const movieSuggestionsProps = useMemo(
    () => ({
      movies,
      onAddMovie: addMovie,
      onVote: voteMovie,
      onDeleteMovie: deleteMovie,
    }),
    [movies, addMovie, voteMovie, deleteMovie],
  )

  const scheduleAvailabilityProps = useMemo(
    () => ({
      movies,
      movieNights,
      onSchedule: scheduleMovieNight,
      onToggleAttendance: toggleAttendance,
      setMovieNights,
      onRemoveMovieNight: removeMovieNight,
    }),
    [movies, movieNights, scheduleMovieNight, toggleAttendance, setMovieNights, removeMovieNight],
  )

  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-center">Movie Night Planner</h1>

        <Tabs defaultValue="suggestions" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="suggestions">Movies</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
          </TabsList>

          <TabsContent value="suggestions">
            <Suspense fallback={<MovieSuggestionsFallback />}>
              <MovieSuggestions {...movieSuggestionsProps} />
            </Suspense>
          </TabsContent>

          <TabsContent value="schedule">
            <Suspense fallback={<ScheduleAvailabilityFallback />}>
              <ScheduleAvailability {...scheduleAvailabilityProps} />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
      <SonnerToastProvider />
    </ThemeProvider>
  )
}

