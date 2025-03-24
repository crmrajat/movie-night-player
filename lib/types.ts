export interface Movie {
  id: string
  title: string
  description: string
  votes: {
    up: number
    down: number
  }
  userVote?: "up" | "down" | null // Track user's vote
}

export interface Attendee {
  id: string
  name: string
  isAttending: boolean
}

export interface MovieNight {
  id: string
  movieId: string
  date: Date
  attendees: Attendee[]
}

