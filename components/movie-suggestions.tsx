"use client"

import { useState, useCallback, memo, useMemo } from "react"
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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ThumbsUp, ThumbsDown, Info, Film, Trash } from "lucide-react"
import { z } from "zod"
import { useToast } from "@/components/ui/use-toast"
import type { Movie } from "@/lib/types"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { cn } from "@/lib/utils"
import Image from "next/image"
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

const movieSchema = z.object({
  title: z.string().min(1, "Movie title is required").max(50, "Title must be 50 characters or less"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description must be 500 characters or less"),
})

type MovieFormValues = z.infer<typeof movieSchema>

interface MovieSuggestionsProps {
  movies: Movie[]
  onAddMovie: (movie: Omit<Movie, "id" | "votes" | "userVote">) => void
  onVote: (id: string, voteType: "up" | "down" | null) => void
  onDeleteMovie: (id: string) => void
}

// Empty state component for when there are no movies
const NoMovies = memo(() => (
  <div className="col-span-full flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
    <Film className="h-16 w-16 mb-4 opacity-20" />
    <h3 className="text-xl font-medium mb-2">No movies suggested yet</h3>
    <p className="max-w-md mb-6">
      Get started by suggesting a movie you'd like to watch. Click the "Suggest Movie" button to add your first movie.
    </p>
  </div>
))

NoMovies.displayName = "NoMovies"

// Memoize the MovieCard component to prevent unnecessary re-renders
const MovieCard = memo(
  ({
    movie,
    onVote,
    onOpenDetails,
    onDeleteMovie,
  }: {
    movie: Movie
    onVote: (id: string, voteType: "up" | "down" | null) => void
    onOpenDetails: (movie: Movie) => void
    onDeleteMovie: (id: string) => void
  }) => {
    const { toast } = useToast()

    const handleVote = useCallback(
      (voteType: "up" | "down") => {
        // If user already voted this way, remove the vote
        if (movie.userVote === voteType) {
          onVote(movie.id, null)
          toast({
            title: "Vote removed",
            description: `You removed your vote ${voteType === "up" ? "for" : "against"} "${movie.title}"`,
          })
        } else {
          // Otherwise, set the vote
          onVote(movie.id, voteType)
          toast({
            title: "Vote recorded",
            description: `You voted ${voteType === "up" ? "for" : "against"} "${movie.title}"`,
          })
        }
      },
      [movie, onVote, toast],
    )

    return (
      <Card className="overflow-hidden h-[250px] flex flex-col shadow-md hover:shadow-lg transition-shadow duration-300">
        <CardContent className="p-0 flex-1 overflow-hidden flex">
          <div className="bg-gray-100 dark:bg-gray-800 w-1/3 max-w-[120px] overflow-hidden">
            <Image
              src={`/placeholder.svg?height=120&width=120`}
              alt={movie.title}
              width={120}
              height={120}
              className="w-full h-full object-cover"
              loading="lazy"
              sizes="120px"
            />
          </div>
          <div className="p-4 flex-1 flex flex-col">
            <h3 className="text-xl font-bold line-clamp-1 mb-2">{movie.title}</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-4 flex-1">{movie.description}</p>
          </div>
        </CardContent>
        <CardFooter className="border-t p-3 flex justify-between bg-gray-50 dark:bg-gray-800/50">
          <div className="flex gap-2">
            <Button
              variant={movie.userVote === "up" ? "default" : "outline"}
              size="sm"
              className={cn(
                "flex items-center gap-1 h-8 px-2",
                movie.userVote === "up"
                  ? "bg-green-600 hover:bg-green-700"
                  : "hover:border-green-500 hover:text-green-500",
              )}
              onClick={() => handleVote("up")}
            >
              <ThumbsUp className="h-4 w-4" />
              <span>{movie.votes.up}</span>
            </Button>
            <Button
              variant={movie.userVote === "down" ? "default" : "outline"}
              size="sm"
              className={cn(
                "flex items-center gap-1 h-8 px-2",
                movie.userVote === "down" ? "bg-red-600 hover:bg-red-700" : "hover:border-red-500 hover:text-red-500",
              )}
              onClick={() => handleVote("down")}
            >
              <ThumbsDown className="h-4 w-4" />
              <span>{movie.votes.down}</span>
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-gray-700 h-8 px-2"
              onClick={() => onOpenDetails(movie)}
            >
              <Info className="h-4 w-4 mr-1" />
              Details
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-500 hover:bg-red-50 hover:text-red-600 h-8 px-2"
              onClick={() => onDeleteMovie(movie.id)}
            >
              <Trash className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        </CardFooter>
      </Card>
    )
  },
)

MovieCard.displayName = "MovieCard"

export function MovieSuggestions({ movies, onAddMovie, onVote, onDeleteMovie }: MovieSuggestionsProps) {
  const [open, setOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)
  const { toast } = useToast()
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [movieToDelete, setMovieToDelete] = useState<string | null>(null)

  const form = useForm<MovieFormValues>({
    resolver: zodResolver(movieSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  })

  const onSubmit = useCallback(
    (data: MovieFormValues) => {
      onAddMovie(data)
      setOpen(false)
      form.reset()
      toast({
        title: "Movie added",
        description: `"${data.title}" has been added to suggestions`,
      })
    },
    [onAddMovie, setOpen, form, toast],
  )

  const openDetails = useCallback((movie: Movie) => {
    setSelectedMovie(movie)
    setDetailsOpen(true)
  }, [])

  const handleDeleteMovie = useCallback((id: string) => {
    setMovieToDelete(id)
    setDeleteConfirmOpen(true)
  }, [])

  const confirmDeleteMovie = useCallback(() => {
    if (movieToDelete) {
      onDeleteMovie(movieToDelete)
      setMovieToDelete(null)
      setDeleteConfirmOpen(false)
      toast({
        title: "Movie deleted",
        description: "The movie has been removed from suggestions",
      })
    }
  }, [movieToDelete, onDeleteMovie, toast])

  // Memoize the movie cards to prevent unnecessary re-renders
  const movieCards = useMemo(
    () =>
      movies.map((movie) => (
        <MovieCard
          key={movie.id}
          movie={movie}
          onVote={onVote}
          onOpenDetails={openDetails}
          onDeleteMovie={handleDeleteMovie}
        />
      )),
    [movies, onVote, openDetails, handleDeleteMovie],
  )

  const handleOpenDialog = useCallback(() => {
    setOpen(true)
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center py-4">
        <h2 className="text-2xl font-bold">Movies</h2>
        <Button onClick={handleOpenDialog}>Suggest Movie</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{movies.length > 0 ? movieCards : <NoMovies />}</div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Suggest a Movie</DialogTitle>
            <DialogDescription>Share a movie you'd like to watch together</DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Movie Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter movie title" {...field} maxLength={50} />
                    </FormControl>
                    <div className="text-xs text-muted-foreground text-right">{field.value.length}/50</div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Brief description of the movie"
                        className="min-h-[100px]"
                        {...field}
                        maxLength={500}
                      />
                    </FormControl>
                    <div className="text-xs text-muted-foreground text-right">{field.value.length}/500</div>
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
                <Button type="submit">Add Movie</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
          {selectedMovie && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedMovie.title}</DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-[120px_1fr] gap-4 mt-4 overflow-hidden flex-1">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-md aspect-square overflow-hidden">
                  <Image
                    src={`/placeholder.svg?height=120&width=120`}
                    alt={selectedMovie.title}
                    width={120}
                    height={120}
                    className="w-full h-full object-cover"
                    sizes="120px"
                    priority
                  />
                </div>
                <div className="overflow-hidden flex flex-col">
                  <div className="prose dark:prose-invert max-w-none overflow-y-auto pr-1 flex-1">
                    <p>{selectedMovie.description}</p>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <div className="flex items-center gap-1 text-sm">
                      <ThumbsUp
                        className={cn("h-4 w-4", selectedMovie.votes.up > 0 ? "text-green-500" : "text-gray-400")}
                      />
                      <span>{selectedMovie.votes.up} votes</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <ThumbsDown
                        className={cn("h-4 w-4", selectedMovie.votes.down > 0 ? "text-red-500" : "text-gray-400")}
                      />
                      <span>{selectedMovie.votes.down} votes</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-4">
                <Button onClick={() => setDetailsOpen(false)}>Close</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Movie</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this movie? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteMovie} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

