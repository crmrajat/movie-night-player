export interface Movie {
  id: string
  title: string
  description: string
  likes: number
  dislikes: number
  imageUrl: string
}

export interface ScheduledMovie {
  movieId: string
  date: Date
  attendees: string[]
}

export type VoteType = "like" | "dislike"

