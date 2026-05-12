"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/init"; // Adjust this path if necessary
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

export default function KeywordPage() {
  const params = useParams();
  const [records, setRecords] = useState<ArchiveRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Decode the URL parameter (converts "Basic%20Training" back to "Basic Training")
  const keywordName = decodeURIComponent(params.tag as string);

  useEffect(() => {
    const fetchKeywordRecords = async () => {
      try {
        // Crucial Difference: We use 'array-contains' because keywords are stored as an array of strings
        const q = query(
          collection(db, "archives"),
          where("keywords", "array-contains", keywordName)
        );
        
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ArchiveRecord[];
        
        setRecords(data);
      } catch (error) {
        console.error("Error fetching records:", error);
      } finally {
        setLoading(false);
      }
    };

    if (keywordName) {
      fetchKeywordRecords();
    }
  }, [keywordName]);

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
            Tag: {keywordName}
          </h1>
          <p className="text-gray-600 text-lg">
            Viewing all archived records containing this keyword.
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-20 text-center text-gray-500 italic animate-pulse">
            Retrieving historical records...
          </div>
        )}

        {/* Empty State */}
        {!loading && records.length === 0 && (
          <div className="py-20 text-center border border-dashed border-gray-300 bg-gray-50">
            <h3 className={`text-xl font-bold mb-2 ${merriweather.className}`}>No records found</h3>
            <p className="text-gray-500">There are currently no items archived with the tag "{keywordName}".</p>
          </div>
        )}

        {/* Records Grid */}
        {!loading && records.length > 0 && (
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
        )}

      </main>

      <Footer />
    </div>
  );
}