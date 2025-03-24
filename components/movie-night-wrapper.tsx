"use client"

import dynamic from "next/dynamic"
import { Suspense } from "react"

// Dynamically import the MovieNightPlanner component with SSR disabled
const MovieNightPlanner = dynamic(() => import("@/components/movie-night-planner"), {
  ssr: false,
  loading: () => <MovieNightPlannerSkeleton />,
})

// Skeleton component for initial loading
function MovieNightPlannerSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
      <div className="h-10 w-64 bg-gray-200 dark:bg-gray-700 rounded mx-auto"></div>
      <div className="h-12 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
      <div className="h-[400px] w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
    </div>
  )
}

export default function MovieNightWrapper() {
  return (
    <Suspense fallback={<MovieNightPlannerSkeleton />}>
      <MovieNightPlanner />
    </Suspense>
  )
}

