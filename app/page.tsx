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

// Fixed Taxonomies (Matching your Admin Page)
const BRANCH_LIST = ["U.S. Army", "U.S. Navy", "U.S. Marine Corps", "U.S. Air Force", "U.S. Coast Guard", "Multiple/Other"];

const FORMAT_LIST = [
  { id: "Handwritten Letter", label: "Handwritten Letters", type: "Letters" },
  { id: "Photograph", label: "Photographs", type: "Other" },
  { id: "Video Interview", label: "Video Interviews (.mp4)", type: "Oral Histories" },
  { id: "Audio Transcript", label: "Audio Transcripts", type: "Oral Histories" }
];

// Interfaces
interface CountDisplay {
  name: string;
  count: number;
  href: string;
  type?: string; // Used for format filtering
}

export default function PortfolioHome() {
  const [formatFilter, setFormatFilter] = useState("View All");
  
  // Dynamic State
  const [eras, setEras] = useState<CountDisplay[]>([]);
  const [keywords, setKeywords] = useState<CountDisplay[]>([]);
  const [branches, setBranches] = useState<CountDisplay[]>([]);
  const [formats, setFormats] = useState<CountDisplay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDynamicData = async () => {
      try {
        // 1. Fetch Eras first (since we need their names from the separate collection)
        const erasQuery = query(collection(db, "eras"), orderBy("createdAt", "asc"));
        const erasSnapshot = await getDocs(erasQuery);
        
        const eraPromises = erasSnapshot.docs.map(async (docSnapshot) => {
          const eraData = docSnapshot.data();
          const q = query(collection(db, "archives"), where("era", "==", eraData.name));
          const countSnap = await getCountFromServer(q);
          return { 
            name: eraData.name, 
            count: countSnap.data().count, 
            href: `/era/${encodeURIComponent(eraData.name)}` 
          };
        });

        const keywordsQuery = query(collection(db, "keywords"), orderBy("createdAt", "asc"));
        const keywordsSnapshot = await getDocs(keywordsQuery);
        
        const keywordsPromises = keywordsSnapshot.docs.map(async (docSnapshot) => {
          const keywordData = docSnapshot.data();
          const q = query(collection(db, "archives"), where("keyword", "==", keywordData.name));
          const countSnap = await getCountFromServer(q);
          return { 
            name: keywordData.name, 
            count: countSnap.data().count, 
            href: `/keyword/${encodeURIComponent(keywordData.name)}` 
          };
        });

        // 2. Build Branch Queries
        const branchPromises = BRANCH_LIST.map(async (branchName) => {
          const q = query(collection(db, "archives"), where("branch", "==", branchName));
          const countSnap = await getCountFromServer(q);
          return {
            name: branchName,
            count: countSnap.data().count,
            href: `/branch/${encodeURIComponent(branchName)}`
          };
        });

        // 3. Build Format Queries
        const formatPromises = FORMAT_LIST.map(async (formatObj) => {
          const q = query(collection(db, "archives"), where("format", "==", formatObj.id));
          const countSnap = await getCountFromServer(q);
          return {
            name: formatObj.label,
            type: formatObj.type,
            count: countSnap.data().count,
            href: `/format/${encodeURIComponent(formatObj.id)}`
          };
        });

        // Execute all database calls simultaneously for maximum speed
        const [eraData, keywordData, branchData, formatData] = await Promise.all([
          Promise.all(eraPromises),
          Promise.all(keywordsPromises),
          Promise.all(branchPromises),
          Promise.all(formatPromises)
        ]);

        setEras(eraData);
        setKeywords(keywordData)
        setBranches(branchData);
        setFormats(formatData);

      } catch (error) {
        console.error("Error fetching dynamic counts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDynamicData();
  }, []);

  return (
    <div className={`min-h-screen bg-[#faf9f6] text-gray-900 selection:bg-gray-300 ${inter.className}`}>
      <Nav />

      <main className="max-w-5xl mx-auto px-8 pt-20 pb-16">
        <div className="text-center mb-12">
          <h1 className={`text-4xl md:text-5xl font-bold mb-4 leading-tight ${merriweather.className}`}>
            The Veterans History Archive
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            A curated collection of personal letters, video oral histories, and photographs gathered through volunteer outreach. Preserving the lived experiences of those who served.
          </p>
        </div>

        <div className="max-w-3xl mx-auto relative mb-20">
          <input 
            type="text" 
            placeholder="Search the archive" 
            className="w-full bg-white border border-gray-300 rounded-none py-4 px-6 text-lg focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 shadow-sm transition-all placeholder-gray-400"
          />
          <button className="absolute right-2 top-2 bg-gray-900 text-white px-6 py-2 uppercase text-xs font-bold tracking-wider hover:bg-gray-800 transition-colors">
            Search
          </button>
        </div>

        <hr className="border-gray-300 mb-16" />

        <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-8 gap-4">
            <h2 className={`text-2xl font-bold italic ${merriweather.className}`}>
              Browse the Index
            </h2>
            
            <div className="flex items-center gap-3">
              <label htmlFor="format-filter" className="text-sm font-medium uppercase tracking-wider text-gray-500">
                Filter By Format:
              </label>
              <select 
                id="format-filter"
                value={formatFilter}
                onChange={(e) => setFormatFilter(e.target.value)}
                className="border border-gray-300 bg-white py-2 px-4 text-sm focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 cursor-pointer"
              >
                <option value="View All">View All</option>
                <option value="Oral Histories">Oral Histories</option>
                <option value="Letters">Letters</option>
              </select>
            </div>
        </div>

        <div id="index" className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-20">
          
          {/* Column 1: Era */}
          <div>
            <h3 className={`text-lg font-bold border-b border-gray-900 pb-2 mb-4 uppercase tracking-wider text-sm ${merriweather.className}`}>
              Browse by Era
            </h3>
            <ul className="space-y-3 text-gray-700">
              {loading ? (
                <li className="text-sm text-gray-500 italic animate-pulse">Loading eras...</li>
              ) : eras.map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="hover:underline hover:text-black flex justify-between group">
                    <span>{item.name}</span>
                    <span className="text-gray-400 text-sm group-hover:text-gray-900 transition-colors">{item.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: Branch & Format */}
          <div>
            <h3 className={`text-lg font-bold border-b border-gray-900 pb-2 mb-4 uppercase tracking-wider text-sm ${merriweather.className}`}>
              Browse by Branch
            </h3>
            <ul className="space-y-3 text-gray-700 mb-8">
              {loading ? (
                <li className="text-sm text-gray-500 italic animate-pulse">Loading branches...</li>
              ) : branches.map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="hover:underline hover:text-black flex justify-between group">
                    <span>{item.name}</span>
                    <span className="text-gray-400 text-sm group-hover:text-gray-900 transition-colors">{item.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
            
            <h3 className={`text-lg font-bold border-b border-gray-900 pb-2 mb-4 uppercase tracking-wider text-sm ${merriweather.className}`}>
              Specific Formats
            </h3>
            <ul className="space-y-3 text-gray-700">
              {loading ? (
                <li className="text-sm text-gray-500 italic animate-pulse">Loading formats...</li>
              ) : formats
                .filter(item => formatFilter === "View All" || item.type === formatFilter || (formatFilter === "View All" && item.type === "Other"))
                .map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="hover:underline hover:text-black flex justify-between group">
                    <span>{item.name}</span>
                    <span className="text-gray-400 text-sm group-hover:text-gray-900 transition-colors">{item.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Keywords (Curated List) */}
          <div>
            <h3 className={`text-lg font-bold border-b border-gray-900 pb-2 mb-4 uppercase tracking-wider text-sm ${merriweather.className}`}>
              Browse by Keyword
            </h3>
            <div className="flex flex-wrap gap-2 text-sm">
              {keywords.map((keyword) => (
                <Link key={keyword.name} href={`/keyword/${encodeURIComponent(keyword.name)}`}>
                  <span className="bg-gray-100 border border-gray-200 px-3 py-1 text-gray-700 hover:border-gray-900 hover:text-gray-900 cursor-pointer transition-colors block">
                    {keyword.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>

        </div>

        {/* ... Rest of your featured and external archive code remains exactly the same ... */}
        {/* Featured Section */}
        <div id="featured" className="mb-20">
          <h2 className={`text-2xl font-bold mb-6 italic ${merriweather.className}`}>
            Featured Collections
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Link href="#" className="block group border border-gray-300 bg-white p-6 hover:border-gray-900 transition-colors shadow-sm hover:shadow-md">
              <div className="text-xs text-gray-500 uppercase tracking-widest mb-2">Letters / European Theater</div>
              <h3 className={`text-xl font-bold mb-3 group-hover:underline ${merriweather.className}`}>
                The Smith Brothers Correspondence
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                A collection of over 50 letters sent between two brothers serving in different divisions of the European theater...
              </p>
              <div className="text-xs font-medium text-gray-900">View Transcripts & Scans &rarr;</div>
            </Link>
          </div>
        </div>

      </main>
      <Footer />
    </div>
  );
}