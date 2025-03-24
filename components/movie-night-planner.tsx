"use client"

import { useState, useCallback, lazy, Suspense, useMemo } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import type { Movie, MovieNight } from "@/lib/types"

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

  // Use useCallback to memoize callback functions
  const addMovie = useCallback((movie: Omit<Movie, "id" | "votes" | "userVote">) => {
    const newMovie: Movie = {
      id: Date.now().toString(),
      ...movie,
      votes: { up: 0, down: 0 },
      userVote: null,
    }
    setMovies((prev) => [...prev, newMovie])
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

  const scheduleMovieNight = useCallback((movieId: string, date: Date) => {
    const newMovieNight: MovieNight = {
      id: Date.now().toString(),
      movieId,
      date,
      attendees: [], // Start with an empty attendees array
    }
    // Use the functional update form to ensure we're working with the latest state
    setMovieNights((prev) => [...prev, newMovieNight])
  }, [])

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

  // Memoize props for child components to prevent unnecessary re-renders
  const movieSuggestionsProps = useMemo(
    () => ({
      movies,
      onAddMovie: addMovie,
      onVote: voteMovie,
    }),
    [movies, addMovie, voteMovie],
  )

  const scheduleAvailabilityProps = useMemo(
    () => ({
      movies,
      movieNights,
      onSchedule: scheduleMovieNight,
      onToggleAttendance: toggleAttendance,
      setMovieNights,
    }),
    [movies, movieNights, scheduleMovieNight, toggleAttendance, setMovieNights],
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
      <Toaster />
    </ThemeProvider>
  )
}

