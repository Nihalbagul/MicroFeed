"use client";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Composer from "../components/composer";
import SearchBar from "../components/search-bar";
import Toolbar from "../components/toolbar";
import usePosts from "../hooks/use-posts";
import PostCard from "../components/post-card";
import PostsList from "../components/PostsList";

// Separate component for the content that uses useSearchParams
function HomeContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const message = searchParams.get("message");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "mine">("all");
  const { posts, isLoading, fetchNextPage, hasNextPage } = usePosts({ query, filter });

  // Ensure posts is always an array
  const postsArray = Array.isArray(posts) ? posts : [];

  return (
    <>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {decodeURIComponent(error)}
        </div>
      )}
      {message && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {decodeURIComponent(message)}
        </div>
      )}
      
      <Composer />
      <SearchBar onSearch={setQuery} />
      <Toolbar filter={filter} onFilterChange={setFilter} />
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <p>Loading...</p>
        </div>
      ) : (
        // Pass the filter and query as props to PostsList
        <PostsList filter={filter} query={query} />
      )}
      
      {hasNextPage && (
        <div className="text-center mt-8">
          <button
            onClick={fetchNextPage}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded transition-colors"
          >
            Load More
          </button>
        </div>
      )}
    </>
  );
}

// Loading fallback component
function HomeLoading() {
  return (
    <main>
      <div className="flex justify-center py-8">
        <p>Loading page...</p>
      </div>
    </main>
  );
}

// Main component with Suspense wrapper
export default function Home() {
  return (
    <main>
      <Suspense fallback={<HomeLoading />}>
        <HomeContent />
      </Suspense>
    </main>
  );
}