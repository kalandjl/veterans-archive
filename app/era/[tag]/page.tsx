"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/init";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { inter, merriweather } from "@/app/fonts"; // Adjust path if needed

export default function EraPage() {
  const params = useParams();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Decode the URL parameter (e.g., converts "World%20War%20II" back to "World War II")
    //   @ts-ignore
  const eraName = decodeURIComponent(params.tag);

  useEffect(() => {
    const fetchEraRecords = async () => {
      try {
        // Query Firestore: Get all archives WHERE era == eraName
        const q = query(
          collection(db, "archives"),
          where("era", "==", eraName)
        );
        
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        setRecords(data);
      } catch (error) {
        console.error("Error fetching records:", error);
      } finally {
        setLoading(false);
      }
    };

    if (eraName) {
      fetchEraRecords();
    }
  }, [eraName]);

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
            {eraName}
          </h1>
          <p className="text-gray-600 text-lg">
            Viewing all archived records, interviews, and letters from this era.
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-20 text-center text-gray-500 italic">
            Retrieving historical records...
          </div>
        )}

        {/* Empty State */}
        {!loading && records.length === 0 && (
          <div className="py-20 text-center border border-dashed border-gray-300 bg-gray-50">
            <h3 className={`text-xl font-bold mb-2 ${merriweather.className}`}>No records found</h3>
            <p className="text-gray-500">There are currently no items archived for {eraName}.</p>
          </div>
        )}

        {/* Records Grid */}
        {!loading && records.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {records.map((record) => (
              <div key={record.id} className="bg-white border border-gray-200 p-6 shadow-sm hover:border-gray-900 hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-widest mb-3 border-b border-gray-100 pb-2">
                    {/* Display file extension/type logic if you want */}
                    {record.format}
                  </div>
                  <h3 className={`text-xl font-bold mb-2 ${merriweather.className}`}>
                    {record.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-6 truncate">
                    File: {record.fileName}
                  </p>
                </div>
                
                <a 
                  href={record.fileUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="inline-block w-full text-center bg-gray-50 border border-gray-300 py-2 text-sm font-medium hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-colors"
                >
                  View Archive
                </a>
              </div>
            ))}
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}