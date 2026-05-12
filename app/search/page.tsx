"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/init"; 
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { Inter, Merriweather } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });
const merriweather = Merriweather({ weight: ["400", "700"], style: ["normal", "italic"], subsets: ["latin"] });

interface ArchiveRecord {
  id: string;
  name: string;
  era: string;
  branch: string;
  format: string;
  fileUrl: string;
}

// We separate the core logic so we can wrap it in <Suspense>
function SearchResults() {
  const searchParams = useSearchParams();
  const rawQuery = searchParams.get("q") || "";
  const searchQuery = rawQuery.trim();

  const [records, setRecords] = useState<ArchiveRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!searchQuery) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const archivesRef = collection(db, "archives");

        // QUERY 1: Check if the Name starts with the search term
        // The '\uf8ff' is a very high code point in Unicode. It tells Firebase to get everything up to that prefix.
        const nameQuery = query(
          archivesRef,
          where("name", ">=", searchQuery),
          where("name", "<=", searchQuery + "\uf8ff")
        );

        // QUERY 2: Check if the exact search term is inside the keywords array
        const keywordQuery = query(
          archivesRef,
          where("keywords", "array-contains", searchQuery)
        );

        // Run both queries simultaneously for speed
        const [nameSnapshot, keywordSnapshot] = await Promise.all([
          getDocs(nameQuery),
          getDocs(keywordQuery)
        ]);

        // Merge the results
        const combinedResults: ArchiveRecord[] = [];
        const seenIds = new Set(); // Used to prevent duplicates

        const processDoc = (doc: any) => {
          if (!seenIds.has(doc.id)) {
            seenIds.add(doc.id);
            combinedResults.push({ id: doc.id, ...doc.data() } as ArchiveRecord);
          }
        };

        nameSnapshot.docs.forEach(processDoc);
        keywordSnapshot.docs.forEach(processDoc);

        setRecords(combinedResults);

      } catch (error) {
        console.error("Error fetching search results:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [searchQuery]);

  if (loading) {
    return (
      <div className="py-20 text-center text-gray-500 italic animate-pulse">
        Searching the archives for "{searchQuery}"...
      </div>
    );
  }

  if (!loading && records.length === 0) {
    return (
      <div className="py-20 text-center border border-dashed border-gray-300 bg-gray-50">
        <h3 className={`text-xl font-bold mb-2 ${merriweather.className}`}>No exact matches found</h3>
        <p className="text-gray-500 mb-4">We couldn't find any records or tags matching "{searchQuery}".</p>
        <p className="text-xs text-gray-400 max-w-md mx-auto">
          *Note: Search is case-sensitive for tags. Try searching for specific names, or use the dropdown filters on the homepage.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {records.map((record) => (
        <div key={record.id} className="bg-white border border-gray-300 p-6 shadow-sm hover:border-gray-900 hover:shadow-md transition-all flex flex-col justify-between group">
          <div>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="bg-gray-100 text-gray-600 text-[10px] uppercase font-bold tracking-wider px-2 py-1">
                {record.format}
              </span>
              <span className="bg-gray-100 text-gray-600 text-[10px] uppercase font-bold tracking-wider px-2 py-1">
                {record.branch}
              </span>
            </div>
            
            <h3 className={`text-xl font-bold mb-2 group-hover:underline ${merriweather.className}`}>
              {record.name}
            </h3>
            <p className="text-sm text-gray-600 mb-6 border-l-2 border-gray-300 pl-3">
              Era: {record.era}
            </p>
          </div>
            
          <a 
            href={record.fileUrl} 
            target="_blank" 
            rel="noreferrer"
            className="inline-block w-full text-center bg-gray-900 text-white py-3 text-xs font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors"
          >
            View Archive
          </a>
        </div>
      ))}
    </div>
  );
}

export default function SearchPage() {
  return (
    <div className={`min-h-screen bg-[#faf9f6] text-gray-900 ${inter.className}`}>
      <Nav />

      <main className="max-w-5xl mx-auto px-8 pt-20 pb-20">
        
        {/* Breadcrumb / Back Button */}
        <div className="mb-8">
          <Link href="/" className="text-sm font-bold uppercase tracking-wider text-gray-500 hover:text-black transition-colors">
            &larr; Back to Index
          </Link>
        </div>

        {/* Page Header */}
        <div className="border-b border-gray-300 pb-8 mb-12">
          <h1 className={`text-4xl md:text-5xl font-bold mb-3 ${merriweather.className}`}>
            Search Results
          </h1>
          <p className="text-gray-600 text-lg">
            Scouring names and keywords across the archive.
          </p>
        </div>

        {/* Suspense handles the loading state of the URL parameters */}
        <Suspense fallback={<div className="py-20 text-center text-gray-500 italic">Initializing search...</div>}>
          <SearchResults />
        </Suspense>

      </main>

      <Footer />
    </div>
  );
}