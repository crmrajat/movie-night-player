"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ThumbsUp, ThumbsDown } from "lucide-react"
import type { Movie, VoteType } from "@/lib/types"
import { movieSchema, type MovieFormValues } from "@/lib/schemas"
import Image from "next/image"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { ScrollArea } from "./ui/scroll-area"

interface MovieSuggestionsProps {
  movies: Movie[]
  onAddMovie: (movie: Omit<Movie, "id" | "likes" | "dislikes">) => void
  onVote: (id: string, voteType: VoteType) => void
}

export default function MovieSuggestions({ movies, onAddMovie, onVote }: MovieSuggestionsProps) {
  const [open, setOpen] = useState(false)

  const form = useForm<MovieFormValues>({
    resolver: zodResolver(movieSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  })

  const onSubmit = (values: MovieFormValues) => {
    onAddMovie({
      title: values.title,
      description: values.description || "",
      imageUrl: "/placeholder.svg?height=150&width=100",
    })
    form.reset()
    setOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Movie Suggestions</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Suggest Movie</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
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
                        <Input placeholder="Enter movie title" {...field} />
                      </FormControl>
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
                        <Textarea placeholder="Brief description of the movie" rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit">Add Movie</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {movies.map((movie) => (
          <Card key={movie.id} className="overflow-hidden h-full flex flex-col">
            <div className="flex flex-1">
              <div className="flex-shrink-0 p-4">
                <Image
                  src={movie.imageUrl || "/placeholder.svg"}
                  alt={movie.title}
                  width={100}
                  height={150}
                  className="rounded-md object-cover"
                />
              </div>
              <div className="flex-1 flex flex-col min-w-0">
                <CardHeader className="pb-2 flex-1">
                  <div className="w-full overflow-hidden">
                    <CardTitle className="text-lg truncate w-full">{movie.title}</CardTitle>
                  </div>
                  <CardDescription>
                    <ScrollArea className="h-[4.5rem]">{movie.description}</ScrollArea>
                  </CardDescription>
                </CardHeader>
                <CardFooter className="pt-0 mt-auto">
                  <div className="w-full">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 hover:bg-green-100 hover:text-green-700 hover:border-green-300 transition-colors"
                        onClick={() => onVote(movie.id, "like")}
                      >
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        {movie.likes}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 hover:bg-red-100 hover:text-red-700 hover:border-red-300 transition-colors"
                        onClick={() => onVote(movie.id, "dislike")}
                      >
                        <ThumbsDown className="h-4 w-4 mr-1" />
                        {movie.dislikes}
                      </Button>
                    </div>
                  </div>
                </CardFooter>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

