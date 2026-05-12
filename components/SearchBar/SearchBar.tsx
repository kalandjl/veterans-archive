"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/init"; // Adjust to your firebase init path

// Hardcoded Taxonomies (Match your admin panel)
const BRANCHES = ["U.S. Army", "U.S. Navy", "U.S. Marine Corps", "U.S. Air Force", "U.S. Coast Guard"];
const FORMATS = [
  { label: "Handwritten Letters", value: "Handwritten Letter" },
  { label: "Photographs", value: "Photograph" },
  { label: "Video Interviews", value: "Video Interview" },
  { label: "Audio Transcripts", value: "Audio Transcript" }
];

export default function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [eras, setEras] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Fetch Era tags once when the component loads
  useEffect(() => {
    const fetchEras = async () => {
      try {
        const snap = await getDocs(collection(db, "eras"));
        const eraNames = snap.docs.map(doc => doc.data().name);
        setEras(eraNames);
      } catch (error) {
        console.error("Failed to fetch eras for search:", error);
      }
    };
    fetchEras();
  }, []);

  // Close dropdown if user clicks outside of it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter logic
  const searchTerm = query.toLowerCase().trim();
  
  const filteredBranches = BRANCHES.filter(b => b.toLowerCase().includes(searchTerm));
  const filteredEras = eras.filter(e => e.toLowerCase().includes(searchTerm));
  const filteredFormats = FORMATS.filter(f => f.label.toLowerCase().includes(searchTerm));

  const hasResults = filteredBranches.length > 0 || filteredEras.length > 0 || filteredFormats.length > 0;

  // Navigation Handlers
  const handleSelect = (path: string) => {
    setQuery("");
    setIsOpen(false);
    router.push(path);
  };

  const handleGeneralSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    handleSelect(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div ref={wrapperRef} className="max-w-3xl mx-auto relative w-full">
      <form onSubmit={handleGeneralSearch} className="relative">
        <input 
          type="text" 
          placeholder="Search for tags, branches, or keywords..." 
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full bg-white border border-gray-300 rounded-none py-4 px-6 text-lg focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 shadow-sm transition-all placeholder-gray-400"
        />
        <button 
          type="submit"
          className="absolute right-2 top-2 bg-gray-900 text-white px-6 py-2 uppercase text-xs font-bold tracking-wider hover:bg-gray-800 transition-colors h-[calc(100%-16px)]"
        >
          Search
        </button>
      </form>

      {/* Autocomplete Dropdown */}
      {isOpen && query.trim().length > 0 && (
        <div className="absolute w-full mt-1 bg-white border border-gray-300 shadow-lg z-50 max-h-96 overflow-y-auto">
          
          {/* Exact Database Matches */}
          {hasResults ? (
            <div className="py-2">
              {filteredEras.length > 0 && (
                <div className="mb-2">
                  <div className="px-4 py-1 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50">Eras</div>
                  {filteredEras.map(era => (
                    <div key={era} onClick={() => handleSelect(`/era/${encodeURIComponent(era)}`)} className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-900 font-medium">
                      {era}
                    </div>
                  ))}
                </div>
              )}

              {filteredBranches.length > 0 && (
                <div className="mb-2">
                  <div className="px-4 py-1 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50">Military Branches</div>
                  {filteredBranches.map(branch => (
                    <div key={branch} onClick={() => handleSelect(`/branch/${encodeURIComponent(branch)}`)} className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-900 font-medium">
                      {branch}
                    </div>
                  ))}
                </div>
              )}

              {filteredFormats.length > 0 && (
                <div className="mb-2">
                  <div className="px-4 py-1 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50">Formats</div>
                  {filteredFormats.map(format => (
                    <div key={format.value} onClick={() => handleSelect(`/format/${encodeURIComponent(format.value)}`)} className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-900 font-medium">
                      {format.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {/* General Keyword/Name Search Fallback */}
          <div className="border-t border-gray-200">
             <div 
               onClick={() => handleGeneralSearch()} 
               className="px-4 py-4 hover:bg-gray-100 cursor-pointer flex items-center gap-2 group"
             >
               <span className="text-gray-500 group-hover:text-black transition-colors">&rarr;</span>
               <span className="text-gray-900 font-medium">Search all archives for <span className="font-bold">"{query}"</span></span>
             </div>
          </div>

        </div>
      )}
    </div>
  );
}