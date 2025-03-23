import MovieNightPlanner from "@/components/movie-night-planner"

export default function Home() {
  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">Movie Night Planner</h1>
      <MovieNightPlanner />
    </main>
  )
}

