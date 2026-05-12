"use client";

import { useState, useEffect } from "react";
import { Inter, Merriweather } from "next/font/google";
import Link from "next/link";
import { collection, getDocs, query, orderBy, where, getCountFromServer } from "firebase/firestore";
import { db } from "@/lib/firebase/init"; 
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });
const merriweather = Merriweather({ weight: ["400", "700"], style: ["normal", "italic"], subsets: ["latin"] });

// Fixed Taxonomies
const BRANCH_LIST = ["U.S. Army", "U.S. Navy", "U.S. Marine Corps", "U.S. Air Force", "U.S. Coast Guard", "Multiple/Other"];
const FORMAT_LIST = [
  { id: "Handwritten Letter", label: "Handwritten Letters" },
  { id: "Photograph", label: "Photographs" },
  { id: "Video Interview", label: "Video Interviews" },
  { id: "Audio Transcript", label: "Audio Transcripts" }
];

interface CountDisplay {
  name: string;
  count: number;
  href: string;
}

export default function BrowsePage() {
  const [totalRecords, setTotalRecords] = useState(0);
  const [eras, setEras] = useState<CountDisplay[]>([]);
  const [branches, setBranches] = useState<CountDisplay[]>([]);
  const [formats, setFormats] = useState<CountDisplay[]>([]);
  const [popularKeywords, setPopularKeywords] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDynamicData = async () => {
      try {
        const archivesRef = collection(db, "archives");

        // 1. Get Absolute Total Records
        const totalCountSnap = await getCountFromServer(archivesRef);
        setTotalRecords(totalCountSnap.data().count);

        // 2. Fetch Eras
        const erasQuery = query(collection(db, "eras"), orderBy("createdAt", "asc"));
        const erasSnapshot = await getDocs(erasQuery);
        
        const eraPromises = erasSnapshot.docs.map(async (docSnapshot) => {
          const eraData = docSnapshot.data();
          const q = query(archivesRef, where("era", "==", eraData.name));
          const countSnap = await getCountFromServer(q);
          return { name: eraData.name, count: countSnap.data().count, href: `/era/${encodeURIComponent(eraData.name)}` };
        });

        // 3. Build Branch Queries
        const branchPromises = BRANCH_LIST.map(async (branchName) => {
          const q = query(archivesRef, where("branch", "==", branchName));
          const countSnap = await getCountFromServer(q);
          return { name: branchName, count: countSnap.data().count, href: `/branch/${encodeURIComponent(branchName)}` };
        });

        // 4. Build Format Queries
        const formatPromises = FORMAT_LIST.map(async (formatObj) => {
          const q = query(archivesRef, where("format", "==", formatObj.id));
          const countSnap = await getCountFromServer(q);
          return { name: formatObj.label, count: countSnap.data().count, href: `/format/${encodeURIComponent(formatObj.id)}` };
        });

        // 5. Fetch Featured Keywords
        const keywordsQuery = query(collection(db, "keywords"), orderBy("createdAt", "asc"));
        const keywordsSnapshot = await getDocs(keywordsQuery);
        const fetchedKeywords = keywordsSnapshot.docs.map(doc => doc.data().name);

        // Execute all database calls simultaneously for maximum speed
        const [eraData, branchData, formatData] = await Promise.all([
          Promise.all(eraPromises),
          Promise.all(branchPromises),
          Promise.all(formatPromises)
        ]);

        setEras(eraData);
        setBranches(branchData);
        setFormats(formatData);
        setPopularKeywords(fetchedKeywords);

      } catch (error) {
        console.error("Error fetching browse data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDynamicData();
  }, []);

  return (
    <div className={`min-h-screen bg-[#faf9f6] text-gray-900 selection:bg-gray-300 ${inter.className}`}>
      <Nav />

      <main className="max-w-6xl mx-auto px-8 pt-20 pb-24">
        
        {/* Souped-Up Hero Section */}
        <div className="text-center mb-24 border-b border-gray-300 pb-16">
          <div className="inline-block mb-4 px-4 py-1 border border-gray-900 text-xs font-bold uppercase tracking-widest">
            The Index
          </div>
          <h1 className={`text-5xl md:text-7xl font-bold mb-6 leading-tight ${merriweather.className}`}>
            Browse the Collection
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto text-xl">
            Navigate through our curated taxonomy of preserved histories.
          </p>
          
          {/* Dynamic Total Stat Counter */}
          <div className="mt-12 flex justify-center gap-12">
            <div>
              <span className={`block text-4xl font-bold ${loading ? 'animate-pulse text-gray-300' : 'text-gray-900'}`}>
                {loading ? '...' : totalRecords}
              </span>
              <span className="text-xs uppercase tracking-widest text-gray-500 font-bold">Total Records</span>
            </div>
            <div>
              <span className={`block text-4xl font-bold ${loading ? 'animate-pulse text-gray-300' : 'text-gray-900'}`}>
                {loading ? '...' : eras.length}
              </span>
              <span className="text-xs uppercase tracking-widest text-gray-500 font-bold">Eras Preserved</span>
            </div>
          </div>
        </div>

        {/* --- THE DIRECTORY --- */}
        <div className="space-y-24">

          {/* Section 1: Eras */}
          <section>
            <div className="flex items-center justify-between mb-8 border-b border-gray-900 pb-2">
              <h2 className={`text-3xl font-bold italic ${merriweather.className}`}>By Historical Era</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {loading ? (
                // Loading Skeletons
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-32 bg-gray-200 animate-pulse border border-gray-300"></div>
                ))
              ) : eras.length === 0 ? (
                <p className="text-gray-500 italic col-span-full">No eras found.</p>
              ) : (
                eras.map((era) => (
                  <Link key={era.name} href={era.href} className="group block bg-white border border-gray-300 p-6 transition-all hover:bg-gray-900 hover:text-white hover:shadow-lg flex flex-col justify-between min-h-[140px]">
                    <h3 className={`text-xl font-bold mb-2 group-hover:underline ${merriweather.className}`}>{era.name}</h3>
                    <div className="text-sm text-gray-500 group-hover:text-gray-300 uppercase tracking-widest font-bold">
                      {era.count}&nbsp;Records &rarr;
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>

          {/* Section 2: Branches */}
          <section>
            <div className="flex items-center justify-between mb-8 border-b border-gray-900 pb-2">
              <h2 className={`text-3xl font-bold italic ${merriweather.className}`}>By Military Branch</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-32 bg-gray-200 animate-pulse border border-gray-300"></div>
                ))
              ) : (
                branches.map((branch) => (
                  <Link key={branch.name} href={branch.href} className="group block bg-white border border-gray-300 p-6 transition-all hover:bg-gray-900 hover:text-white hover:shadow-lg flex flex-col justify-between min-h-[140px]">
                    <h3 className={`text-xl font-bold mb-2 group-hover:underline ${merriweather.className}`}>{branch.name}</h3>
                    <div className="text-sm text-gray-500 group-hover:text-gray-300 uppercase tracking-widest font-bold">
                      {branch.count}&nbsp;Records &rarr;
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>

          {/* Section 3: Formats & Media Type */}
          <section>
            <div className="flex items-center justify-between mb-8 border-b border-gray-900 pb-2">
              <h2 className={`text-3xl font-bold italic ${merriweather.className}`}>By Media Format</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-32 bg-gray-200 animate-pulse border border-gray-300"></div>
                ))
              ) : (
                formats.map((format) => (
                  <Link key={format.name} href={format.href} className="group block bg-white border border-gray-300 p-6 transition-all hover:bg-gray-900 hover:text-white hover:shadow-lg flex flex-col justify-between min-h-[140px]">
                    <h3 className={`text-xl font-bold mb-2 group-hover:underline ${merriweather.className}`}>{format.name}</h3>
                    <div className="text-sm text-gray-500 group-hover:text-gray-300 uppercase tracking-widest font-bold">
                      {format.count}&nbsp;Items &rarr;
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>

          {/* Section 4: Featured Keywords */}
          <section>
            <div className="flex items-center justify-between mb-8 border-b border-gray-900 pb-2">
              <h2 className={`text-3xl font-bold italic ${merriweather.className}`}>Keywords/Tags</h2>
            </div>
            
            <div className="flex flex-wrap gap-4">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-12 w-32 bg-gray-200 animate-pulse border border-gray-300"></div>
                ))
              ) : popularKeywords.length === 0 ? (
                 <p className="text-gray-500 italic">No featured topics available.</p>
              ) : (
                popularKeywords.map((keyword) => (
                  <Link key={keyword} href={`/keyword/${encodeURIComponent(keyword)}`}>
                    <span className="block bg-white border border-gray-300 px-6 py-3 text-lg text-gray-900 hover:border-gray-900 hover:bg-gray-900 hover:text-white cursor-pointer transition-colors shadow-sm hover:shadow-md">
                      # {keyword}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </section>

        </div>
      </main>
      
      <Footer />
    </div>
  );
}