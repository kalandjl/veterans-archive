"use client"; // Required for state management (the dropdown filter)

import { useState } from "react";
import { Inter, Merriweather } from "next/font/google";
import Link from "next/link";
// Assuming you have these exported from a fonts.js file, otherwise use the imports above
import { inter, merriweather } from "./fonts"; 
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

// Mock Data
const browseByConflict = [
  { name: "World War II", count: 84, href: "#" },
  { name: "Korean War", count: 32, href: "#" },
  { name: "Vietnam War", count: 156, href: "#" },
  { name: "Gulf War (OEF/OIF)", count: 94, href: "#" },
  { name: "Peacetime Service", count: 41, href: "#" },
];

const browseByBranch = [
  { name: "U.S. Army", count: 188, href: "#" },
  { name: "U.S. Navy", count: 92, href: "#" },
  { name: "U.S. Marine Corps", count: 76, href: "#" },
  { name: "U.S. Air Force", count: 45, href: "#" },
  { name: "U.S. Coast Guard", count: 6, href: "#" },
];

const browseByFormat = [
  { name: "Handwritten Letters", count: 312, href: "#", type: "Letters" },
  { name: "Video Interviews (.mp4)", count: 58, href: "#", type: "Oral Histories" },
  { name: "Audio Transcripts", count: 24, href: "#", type: "Oral Histories" },
  { name: "Photographs", count: 189, href: "#", type: "Other" },
];

const keywords = [
  "Letters Home", "Basic Training", "Deployment", 
  "Brotherhood", "Homefront", "POW/MIA", "Civilian Life"
];

export default function PortfolioHome() {
  // State for the Browse Index dropdown
  const [formatFilter, setFormatFilter] = useState("View All");

  return (
    <div className={`min-h-screen bg-[#faf9f6] text-gray-900 selection:bg-gray-300 ${inter.className}`}>
      
      <Nav />

      {/* Main Hero / Search */}
      <main className="max-w-5xl mx-auto px-8 pt-20 pb-16">
        <div className="text-center mb-12">
          <h1 className={`text-4xl md:text-5xl font-bold mb-4 leading-tight ${merriweather.className}`}>
            The Veterans History Archive
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            A curated collection of personal letters, video oral histories, and photographs gathered through volunteer outreach. Preserving the lived experiences of those who served.
          </p>
        </div>

        {/* Giant Search Bar */}
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

        {/* Directory Browse Section Header with Dropdown */}
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-8 gap-4">
            <h2 className={`text-2xl font-bold italic ${merriweather.className}`}>
              Browse the Index
            </h2>
            
            {/* Format Filter Dropdown */}
            <div className="flex items-center gap-3">
              <label htmlFor="format-filter" className="text-sm font-medium uppercase tracking-wider text-gray-500">
                Filter By Format:
              </label>
              <select 
                id="format-filter"
                value={formatFilter}
                onChange={(e) => setFormatFilter(e.target.value)}
                className="border border-gray-300 bg-white py-2 px-4 text-sm focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
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
              {browseByConflict.map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="hover:underline hover:text-black flex justify-between">
                    <span>{item.name}</span>
                    <span className="text-gray-400 text-sm">{item.count}</span>
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
              {browseByBranch.map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="hover:underline hover:text-black flex justify-between">
                    <span>{item.name}</span>
                    <span className="text-gray-400 text-sm">{item.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
            
            <h3 className={`text-lg font-bold border-b border-gray-900 pb-2 mb-4 uppercase tracking-wider text-sm ${merriweather.className}`}>
              Specific Formats
            </h3>
            <ul className="space-y-3 text-gray-700">
              {browseByFormat
                .filter(item => formatFilter === "View All" || item.type === formatFilter || (formatFilter === "View All" && item.type === "Other"))
                .map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="hover:underline hover:text-black flex justify-between">
                    <span>{item.name}</span>
                    <span className="text-gray-400 text-sm">{item.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Keywords */}
          <div>
            <h3 className={`text-lg font-bold border-b border-gray-900 pb-2 mb-4 uppercase tracking-wider text-sm ${merriweather.className}`}>
              Browse by Keyword
            </h3>
            <div className="flex flex-wrap gap-2 text-sm">
              {keywords.map((keyword) => (
                <span key={keyword} className="bg-gray-100 border border-gray-200 px-3 py-1 text-gray-700 hover:border-gray-900 hover:text-gray-900 cursor-pointer transition-colors">
                  {keyword}
                </span>
              ))}
            </div>
          </div>

        </div>

        {/* Featured Section */}
        <div id="featured" className="mb-20">
          <h2 className={`text-2xl font-bold mb-6 italic ${merriweather.className}`}>
            Featured Collections
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Exhibit 1 */}
            <Link href="#" className="block group border border-gray-300 bg-white p-6 hover:border-gray-900 transition-colors shadow-sm hover:shadow-md">
              <div className="text-xs text-gray-500 uppercase tracking-widest mb-2">Letters / European Theater</div>
              <h3 className={`text-xl font-bold mb-3 group-hover:underline ${merriweather.className}`}>
                The Smith Brothers Correspondence
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                A collection of over 50 letters sent between two brothers serving in different divisions of the European theater, detailing daily life, rationing, and the longing for home.
              </p>
              <div className="text-xs font-medium text-gray-900">View Transcripts & Scans &rarr;</div>
            </Link>

            {/* Exhibit 2 */}
            <Link href="#" className="block group border border-gray-300 bg-white p-6 hover:border-gray-900 transition-colors shadow-sm hover:shadow-md">
              <div className="text-xs text-gray-500 uppercase tracking-widest mb-2">Oral History / Vietnam</div>
              <h3 className={`text-xl font-bold mb-3 group-hover:underline ${merriweather.className}`}>
                Sergeant First Class, Dean Baratta
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                An extensive hour-long interview covering his enlistment, deployment to Vietnam, combat experiences, and the complex realities of returning to civilian life in the 1970s.
              </p>
              <div className="text-xs font-medium text-gray-900">Watch Video Interview &rarr;</div>
            </Link>

          </div>
        </div>

        <hr className="border-gray-300 mb-16" />

        {/* External Databases Section */}
        <div id="external-databases" className="bg-white border border-gray-300 p-8">
          <h2 className={`text-2xl font-bold mb-2 ${merriweather.className}`}>
            Explore Partner Archives
          </h2>
          <p className="text-gray-600 mb-6">
            Looking for a specific record? Expand your search by exploring these national databases and affiliated oral history projects.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a href="https://www.loc.gov/vets/" target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 border border-gray-200 hover:border-gray-900 transition-colors group">
              <div>
                <h4 className="font-bold text-gray-900 group-hover:underline">Library of Congress VHP</h4>
                <p className="text-xs text-gray-500 mt-1">80,000+ collections of US Veterans</p>
              </div>
              <span className="text-gray-400 group-hover:text-gray-900">&rarr;</span>
            </a>

            <a href="https://australiansatwarfilmarchive.unsw.edu.au/" target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 border border-gray-200 hover:border-gray-900 transition-colors group">
              <div>
                <h4 className="font-bold text-gray-900 group-hover:underline">Australians at War Film Archive</h4>
                <p className="text-xs text-gray-500 mt-1">2,000+ interviews by the DVA</p>
              </div>
              <span className="text-gray-400 group-hover:text-gray-900">&rarr;</span>
            </a>
          </div>
        </div>

      </main>
      
      <Footer />
    </div>
  );
}