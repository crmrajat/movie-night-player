"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import MovieSuggestions from "@/components/movie-suggestions"
import ScheduleViewing from "@/components/schedule-viewing"
import type { Movie, ScheduledMovie, VoteType } from "@/lib/types"

export default function MovieNightPlanner() {
  const [movies, setMovies] = useState<Movie[]>([
    {
      id: "1",
      title: "The Shawshank Redemption",
      description: "Two imprisoned men bond over a number of years.",
      likes: 4,
      dislikes: 1,
      imageUrl: "/placeholder.svg?height=150&width=100",
    },
    {
      id: "2",
      title: "The Godfather",
      description: "The aging patriarch of an organized crime dynasty transfers control to his son.",
      likes: 2,
      dislikes: 0,
      imageUrl: "/placeholder.svg?height=150&width=100",
    },
    {
      id: "3",
      title: "The Dark Knight",
      description: "Batman fights the menace known as the Joker.",
      likes: 5,
      dislikes: 2,
      imageUrl: "/placeholder.svg?height=150&width=100",
    },
  ])

  const [scheduledMovies, setScheduledMovies] = useState<ScheduledMovie[]>([
    { movieId: "1", date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), attendees: ["Alice", "Bob", "Charlie"] },
  ])

  const addMovie = (movie: Omit<Movie, "id" | "likes" | "dislikes">) => {
    const newMovie: Movie = {
      ...movie,
      id: Date.now().toString(),
      likes: 0,
      dislikes: 0,
    }
    setMovies([...movies, newMovie])
  }

  const voteForMovie = (id: string, voteType: VoteType) => {
    setMovies(
      movies.map((movie) =>
        movie.id === id
          ? {
              ...movie,
              likes: voteType === "like" ? movie.likes + 1 : movie.likes,
              dislikes: voteType === "dislike" ? movie.dislikes + 1 : movie.dislikes,
            }
          : movie,
      ),
    )
  }

  const scheduleMovie = (movieId: string, date: Date) => {
    setScheduledMovies([...scheduledMovies, { movieId, date, attendees: [] }])
  }

  const markAvailability = (movieId: string, name: string) => {
    setScheduledMovies(
      scheduledMovies.map((scheduled) =>
        scheduled.movieId === movieId ? { ...scheduled, attendees: [...scheduled.attendees, name] } : scheduled,
      ),
    )
  }

  return (
    <Tabs defaultValue="suggestions" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="suggestions">Movie Suggestions</TabsTrigger>
        <TabsTrigger value="schedule">Schedule & Availability</TabsTrigger>
      </TabsList>
      <TabsContent value="suggestions">
        <MovieSuggestions movies={movies} onAddMovie={addMovie} onVote={voteForMovie} />
      </TabsContent>
      <TabsContent value="schedule">
        <ScheduleViewing
          movies={movies}
          scheduledMovies={scheduledMovies}
          onScheduleMovie={scheduleMovie}
          onMarkAvailability={markAvailability}
        />
      </TabsContent>
    </Tabs>
  )
}

