"use client"

import { useState, useCallback, lazy, Suspense, useMemo } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { SonnerToastProvider } from "@/components/sonner-toast-provider"
import type { Movie, MovieNight } from "@/lib/types"
import { toast } from "sonner"
import { format } from "date-fns"
import { Film, CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

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
  const [activeTab, setActiveTab] = useState<"suggestions" | "schedule">("suggestions")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Movie state management
  const [movies, setMovies] = useState<Movie[]>([
    {
      id: "1",
      title: "Inception",
      description:
        "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
      votes: { up: 15, down: 3 },
      userVote: null,
    },
    {
      id: "2",
      title: "The Shawshank Redemption",
      description:
        "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.",
      votes: { up: 20, down: 1 },
      userVote: null,
    },
    {
      id: "3",
      title: "Pulp Fiction",
      description:
        "The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.",
      votes: { up: 12, down: 5 },
      userVote: null,
    },
    {
      id: "4",
      title: "The Dark Knight",
      description:
        "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.",
      votes: { up: 18, down: 2 },
      userVote: null,
    },
  ])

  // Movie night state management
  const [movieNights, setMovieNights] = useState<MovieNight[]>([
    {
      id: "101",
      movieId: "1",
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // One week from now
      attendees: [
        { id: "a1", name: "Alex", isAttending: true },
        { id: "a2", name: "Jamie", isAttending: true },
        { id: "a3", name: "Taylor", isAttending: false },
      ],
    },
    {
      id: "102",
      movieId: "3",
      date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Two weeks from now
      attendees: [
        { id: "a4", name: "Jordan", isAttending: true },
        { id: "a5", name: "Casey", isAttending: true },
        { id: "a6", name: "Riley", isAttending: true },
        { id: "a7", name: "Morgan", isAttending: false },
      ],
    },
  ])
  const [deletedMovies, setDeletedMovies] = useState<Movie[]>([])
  const [deletedMovieNights, setDeletedMovieNights] = useState<MovieNight[]>([])

  // Callback functions
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
              toast.error(`You removed your vote for "${movie.title}"`)
            } else if (movie.userVote === "down") {
              toast.error(`You removed your vote against "${movie.title}"`)
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

  // Delete movie with undo functionality
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

  // Remove movie night with undo functionality
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

  // Memoize props for child components
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

  const handleTabChange = useCallback((tab: "suggestions" | "schedule") => {
    setActiveTab(tab)
    setMobileMenuOpen(false)
  }, [])

  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <div className=" flex flex-col min-h-screen ">
        <header className="p-3 w-full border-b sticky top-0 bg-background z-10 shadow-sm flex items-center justify-between">
          <div className="container mx-auto flex items-center justify-between">
            <h1 className="text-2xl font-bold flex items-center">
              <span className="hidden sm:inline">Movie Night Planner</span>
              <span className="sm:hidden">MNP</span>
            </h1>

            {/* Navigation */}
            <nav className="flex items-center space-x-2 sm:space-x-4">
              <Button
                variant="link"
                onClick={() => setActiveTab("suggestions")}
                className={cn(
                  "flex items-center gap-2 font-medium",
                  activeTab === "suggestions" ? "text-primary underline" : "text-foreground",
                )}
              >
                <Film className="h-4 w-4" />
                <span>Movies</span>
              </Button>
              <Button
                variant="link"
                onClick={() => setActiveTab("schedule")}
                className={cn(
                  "flex items-center gap-2 font-medium",
                  activeTab === "schedule" ? "text-primary underline" : "text-foreground",
                )}
              >
                <CalendarIcon className="h-4 w-4" />
                <span>Schedule</span>
              </Button>
            </nav>
          </div>
        </header>

        <main className="flex-1">
          <div className="p-3 container mx-auto py-6">
            {activeTab === "suggestions" && (
              <Suspense fallback={<MovieSuggestionsFallback />}>
                <MovieSuggestions {...movieSuggestionsProps} />
              </Suspense>
            )}

            {activeTab === "schedule" && (
              <Suspense fallback={<ScheduleAvailabilityFallback />}>
                <ScheduleAvailability {...scheduleAvailabilityProps} />
              </Suspense>
            )}
          </div>
        </main>
      </div>
      <SonnerToastProvider />
    </ThemeProvider>
  )
}

