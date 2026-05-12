"use client";

import { useState, useEffect, useRef } from "react";
import { auth, provider, db, storage } from "@/lib/firebase/init";
import { useAuthState } from "react-firebase-hooks/auth";
import { signInWithPopup, signOut } from "firebase/auth";
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import Link from "next/link";
import { Inter, Merriweather } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });
const merriweather = Merriweather({ weight: ["400", "700"], style: ["normal", "italic"], subsets: ["latin"] });

interface ArchiveRecord {
  id: string;
  name: string;
  era: string;
  branch: string;
  keywords: string[];
  format: string; 
  fileUrl: string; 
  storagePath?: string; 
  fileName?: string; 
  createdAt?: any;
}

interface TaxonomyRecord {
  id: string;
  name: string;
  createdAt?: any;
}

const BRANCHES = ["U.S. Army", "U.S. Navy", "U.S. Marine Corps", "U.S. Air Force", "U.S. Coast Guard", "Multiple/Other"];

export default function AdminPage() {
  const [user, loading] = useAuthState(auth);
  const [activeTab, setActiveTab] = useState("upload"); 
  
  // --- Form State ---
  const [uploadMethod, setUploadMethod] = useState<"file" | "link">("file");
  const [name, setName] = useState("");
  const [era, setEra] = useState("");
  const [branch, setBranch] = useState(BRANCHES[0]);
  const [keywords, setKeywords] = useState(""); 
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileFormat, setFileFormat] = useState("Handwritten Letter"); 
  const [linkUrl, setLinkUrl] = useState("");
  const [linkFormat, setLinkFormat] = useState("Video Interview"); 
  const [uploading, setUploading] = useState(false);
  
  // --- Manage Archives State ---
  const [records, setRecords] = useState<ArchiveRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  // --- Manage Eras State ---
  const [eras, setEras] = useState<TaxonomyRecord[]>([]);
  const [newEraName, setNewEraName] = useState("");
  const [addingEra, setAddingEra] = useState(false);

  // --- Manage Featured Keywords State ---
  const [featuredKeywords, setFeaturedKeywords] = useState<TaxonomyRecord[]>([]);
  const [newKeywordName, setNewKeywordName] = useState("");
  const [addingKeyword, setAddingKeyword] = useState(false);

  const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  const DEV_EMAIL = process.env.NEXT_PUBLIC_DEV_EMAIL;
  
  useEffect(() => {
    if (user) {
      if (user.email !== ADMIN_EMAIL && user.email !== DEV_EMAIL) {
        signOut(auth);
        alert("Unauthorized account.");
      } else {
        fetchEras();
        fetchFeaturedKeywords();
      }
    }
  }, [user, ADMIN_EMAIL, DEV_EMAIL]);

  const handleLogin = async () => {
    try { await signInWithPopup(auth, provider); } 
    catch (error) { console.error("Login Error:", error); }
  };

  const handleLogout = () => signOut(auth);

  // --- ERA LOGIC ---
  const fetchEras = async () => {
    try {
      const q = query(collection(db, "eras"), orderBy("createdAt", "asc"));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TaxonomyRecord[];
      setEras(data);
      if (data.length > 0) setEra(data[0].name); 
    } catch (error) { console.error("Failed to fetch eras:", error); }
  };

  const handleAddEra = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEraName.trim()) return;
    setAddingEra(true);
    try {
      await addDoc(collection(db, "eras"), { name: newEraName.trim(), createdAt: new Date() });
      setNewEraName("");
      fetchEras(); 
    } catch (error) { console.error("Failed to add era:", error); }
    setAddingEra(false);
  };

  const handleDeleteEra = async (id: string) => {
    if (!window.confirm("Delete this era tag?")) return;
    try {
      await deleteDoc(doc(db, "eras", id));
      setEras(eras.filter((e) => e.id !== id));
    } catch (error) { console.error("Failed to delete era:", error); }
  };

  // --- FEATURED KEYWORDS LOGIC ---
  const fetchFeaturedKeywords = async () => {
    try {
      const q = query(collection(db, "keywords"), orderBy("createdAt", "asc"));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TaxonomyRecord[];
      setFeaturedKeywords(data);
    } catch (error) { console.error("Failed to fetch keywords:", error); }
  };

  const handleAddKeyword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeywordName.trim()) return;
    setAddingKeyword(true);
    try {
      await addDoc(collection(db, "keywords"), { name: newKeywordName.trim(), createdAt: new Date() });
      setNewKeywordName("");
      fetchFeaturedKeywords(); 
    } catch (error) { console.error("Failed to add keyword:", error); }
    setAddingKeyword(false);
  };

  const handleDeleteKeyword = async (id: string) => {
    if (!window.confirm("Remove this keyword from the homepage?")) return;
    try {
      await deleteDoc(doc(db, "featured_keywords", id));
      setFeaturedKeywords(featuredKeywords.filter((k) => k.id !== id));
    } catch (error) { console.error("Failed to delete keyword:", error); }
  };

  // --- UPLOAD LOGIC ---
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !era || !branch) return alert("Please fill out all basic information.");
    if (uploadMethod === "file" && !file) return alert("Please attach a file.");
    if (uploadMethod === "link" && !linkUrl) return alert("Please provide a link URL.");
    
    setUploading(true);

    try {
      const keywordArray = keywords.split(",").map(k => k.trim()).filter(k => k !== "");
      let finalUrl = "";
      let storagePath = null;
      let actualFileName = null;
      let actualFormat = uploadMethod === "file" ? fileFormat : linkFormat;

      if (uploadMethod === "file" && file) {
        const storageRef = ref(storage, `archives/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        finalUrl = await getDownloadURL(storageRef);
        storagePath = storageRef.fullPath;
        actualFileName = file.name;
      } else {
        finalUrl = linkUrl;
      }

      const newDocData: any = {
        name, era, branch, keywords: keywordArray, format: actualFormat, fileUrl: finalUrl, createdAt: new Date()
      };

      if (storagePath) newDocData.storagePath = storagePath;
      if (actualFileName) newDocData.fileName = actualFileName;

      await addDoc(collection(db, "archives"), newDocData);
      alert("Upload successful!");
      
      setName(""); setKeywords(""); setFile(null); setLinkUrl("");
      if (fileInputRef.current) fileInputRef.current.value = "";

    } catch (error) {
      console.error("Upload failed:", error);
      alert("Upload failed. Check the console for errors.");
    }
    setUploading(false);
  };

  // --- FETCH & DELETE ARCHIVES LOGIC ---
  const fetchRecords = async () => {
    const q = query(collection(db, "archives"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ArchiveRecord[];
    setRecords(data);
  };

  useEffect(() => { if (user && activeTab === "manage") fetchRecords(); }, [user, activeTab]);

  const handleDeleteRecord = async (id: string, storagePath?: string) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    try {
      await deleteDoc(doc(db, "archives", id));
      if (storagePath) {
        const fileRef = ref(storage, storagePath);
        await deleteObject(fileRef);
      }
      setRecords(records.filter((record) => record.id !== id));
    } catch (error) { console.error("Delete failed:", error); }
  };

  const filteredRecords = records.filter((r) => r.name.toLowerCase().includes(searchTerm.toLowerCase()));

  // --- UI RENDER ---
  if (loading) return <div className={`min-h-screen bg-[#faf9f6] flex items-center justify-center text-gray-900 ${inter.className}`}>Loading dashboard...</div>;

  return (
    <div className={`min-h-screen bg-[#faf9f6] text-gray-900 pb-20 ${inter.className}`}>
      <nav className="max-w-5xl mx-auto px-8 py-6">
        <Link href="/"><span className="text-sm font-bold uppercase tracking-wider text-gray-500 hover:text-black transition-colors cursor-pointer">&larr; Return Home</span></Link>
      </nav>
      
      <main className="max-w-4xl mx-auto px-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-end border-b border-gray-300 pb-6 mb-8 gap-4">
          <div>
            <h1 className={`text-4xl font-bold mb-2 ${merriweather.className}`}>Admin Dashboard</h1>
            <p className="text-gray-600">Logged in as: <span className="font-medium text-gray-900">{user?.email ?? ""}</span></p>
          </div>
          <button onClick={handleLogout} className="text-sm text-red-600 font-bold uppercase tracking-wider hover:text-red-800 transition">Sign Out</button>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-10">
          <button onClick={() => setActiveTab("upload")} className={`px-6 py-2 uppercase text-xs font-bold tracking-wider transition-colors ${activeTab === "upload" ? "bg-gray-900 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}>Upload Record</button>
          <button onClick={() => setActiveTab("manage")} className={`px-6 py-2 uppercase text-xs font-bold tracking-wider transition-colors ${activeTab === "manage" ? "bg-gray-900 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}>Manage Archives</button>
          <button onClick={() => setActiveTab("eras")} className={`px-6 py-2 uppercase text-xs font-bold tracking-wider transition-colors ${activeTab === "eras" ? "bg-gray-900 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}>Manage Era Tags</button>
          <button onClick={() => setActiveTab("keywords")} className={`px-6 py-2 uppercase text-xs font-bold tracking-wider transition-colors ${activeTab === "keywords" ? "bg-gray-900 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}>Homepage Keywords</button>
        </div>

        {/* TAB 1: UPLOAD FORM */}
        {activeTab === "upload" && (
           <form onSubmit={handleUpload} className="space-y-12">
            {/* Section 1 */}
            <div>
              <h3 className={`text-xl font-bold mb-6 italic ${merriweather.className}`}>1. Record Information</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold uppercase tracking-wider mb-2 text-gray-700">Veteran / Record Name</label>
                  <input type="text" required value={name ?? ""} onChange={e => setName(e.target.value)} className="w-full bg-white border border-gray-300 rounded-none py-3 px-4 text-gray-900 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 placeholder-gray-400" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold uppercase tracking-wider mb-2 text-gray-700">Era</label>
                    {eras.length === 0 ? (
                      <p className="text-sm text-red-600 italic py-3">Please add an Era Tag first.</p>
                    ) : (
                      <select required value={era ?? ""} onChange={e => setEra(e.target.value)} className="w-full bg-white border border-gray-300 rounded-none py-3 px-4 text-gray-900 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900">
                        {eras.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-bold uppercase tracking-wider mb-2 text-gray-700">Military Branch</label>
                    <select required value={branch ?? ""} onChange={e => setBranch(e.target.value)} className="w-full bg-white border border-gray-300 rounded-none py-3 px-4 text-gray-900 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900">
                      {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold uppercase tracking-wider mb-2 text-gray-700">Keywords <span className="text-gray-400 normal-case font-normal">(Comma separated)</span></label>
                  <input 
                    type="text" 
                    placeholder="e.g. Basic Training, POW/MIA, Letters Home" 
                    value={keywords ?? ""} onChange={e => setKeywords(e.target.value)} 
                    className="w-full bg-white border border-gray-300 rounded-none py-3 px-4 text-gray-900 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 placeholder-gray-400" 
                  />
                </div>
              </div>
            </div>

            <hr className="border-gray-300" />

            {/* Section 2 */}
            <div>
              <div className="flex justify-between items-end mb-6">
                <h3 className={`text-xl font-bold italic ${merriweather.className}`}>2. Media Source</h3>
                
                <div className="flex border border-gray-300">
                  <button type="button" onClick={() => setUploadMethod("file")} className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${uploadMethod === "file" ? "bg-gray-900 text-white" : "bg-white text-gray-500 hover:text-gray-900"}`}>File Upload</button>
                  <button type="button" onClick={() => setUploadMethod("link")} className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${uploadMethod === "link" ? "bg-gray-900 text-white" : "bg-white text-gray-500 hover:text-gray-900"}`}>Embed Link</button>
                </div>
              </div>

              {uploadMethod === "file" ? (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold uppercase tracking-wider mb-2 text-gray-700">Format Type</label>
                    <select value={fileFormat ?? ""} onChange={e => setFileFormat(e.target.value)} className="w-full bg-white border border-gray-300 rounded-none py-3 px-4 text-gray-900 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900">
                      <option value="Handwritten Letter">Handwritten Letter</option>
                      <option value="Photograph">Photograph</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold uppercase tracking-wider mb-2 text-gray-700">Upload File</label>
                    <input 
                      ref={fileInputRef}
                      type="file" required={uploadMethod === "file"}
                      onChange={e => { if (e.target.files) setFile(e.target.files[0]); }}
                      className="w-full bg-white border border-gray-300 text-gray-900 py-2 px-3 file:mr-4 file:py-2 file:px-4 file:border-0 file:bg-gray-200 file:text-gray-900 file:text-xs file:font-bold file:uppercase file:tracking-wider hover:file:bg-gray-300 transition-colors"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold uppercase tracking-wider mb-2 text-gray-700">Format Type</label>
                    <select value={linkFormat ?? ""} onChange={e => setLinkFormat(e.target.value)} className="w-full bg-white border border-gray-300 rounded-none py-3 px-4 text-gray-900 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900">
                      <option value="Video Interview">Video Interview</option>
                      <option value="Audio Transcript">Audio Transcript</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold uppercase tracking-wider mb-2 text-gray-700">External URL <span className="text-gray-400 normal-case font-normal">(YouTube, Vimeo)</span></label>
                    <input 
                      type="url" placeholder="https://youtube.com/watch?v=..." required={uploadMethod === "link"}
                      value={linkUrl ?? ""} onChange={e => setLinkUrl(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-none py-3 px-4 text-gray-900 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 placeholder-gray-400"
                    />
                  </div>
                </div>
              )}
            </div>

            <button type="submit" disabled={uploading || eras.length === 0} className="w-full bg-gray-900 text-white px-6 py-4 uppercase text-sm font-bold tracking-wider hover:bg-gray-800 transition-colors disabled:bg-gray-400">
              {uploading ? "Publishing to Archive..." : "Publish Record"}
            </button>
          </form>
        )}

        {/* TAB 2: MANAGE ARCHIVES */}
        {activeTab === "manage" && (
           <div>
           <input type="text" placeholder="Search archives by name..." value={searchTerm ?? ""} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-white border border-gray-300 rounded-none py-4 px-6 mb-8 text-gray-900 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 placeholder-gray-400" />
           
           <div className="space-y-4">
             {filteredRecords.map((record) => (
               <div key={record.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 border border-gray-300 bg-white gap-4 group hover:border-gray-900 transition-colors">
                 <div>
                   <h3 className={`text-xl font-bold mb-2 text-gray-900 ${merriweather.className}`}>{record.name}</h3>
                   <div className="flex flex-wrap gap-2">
                     <span className="bg-gray-100 border border-gray-200 text-gray-700 text-xs px-2 py-1 uppercase tracking-wider">{record.era}</span>
                     <span className="bg-gray-100 border border-gray-200 text-gray-700 text-xs px-2 py-1 uppercase tracking-wider">{record.format}</span>
                     <span className="bg-gray-100 border border-gray-200 text-gray-700 text-xs px-2 py-1 uppercase tracking-wider">{record.branch}</span>
                   </div>
                 </div>
                 <div className="flex items-center gap-4">
                   <a href={record.fileUrl} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-black uppercase text-xs font-bold tracking-wider transition-colors">View Media &rarr;</a>
                   <button onClick={() => handleDeleteRecord(record.id, record.storagePath)} className="text-red-600 hover:text-red-800 uppercase text-xs font-bold tracking-wider transition-colors">
                     Delete
                   </button>
                 </div>
               </div>
             ))}
             {filteredRecords.length === 0 && <p className="text-gray-500 italic py-8 text-center border border-dashed border-gray-300">No records found.</p>}
           </div>
         </div>
        )}

        {/* TAB 3: MANAGE ERAS */}
        {activeTab === "eras" && (
          <div className="space-y-10">
            <form onSubmit={handleAddEra} className="flex flex-col md:flex-row gap-4">
              <input type="text" required placeholder="New Era Name (e.g. World War I)" value={newEraName ?? ""} onChange={e => setNewEraName(e.target.value)} className="flex-grow bg-white border border-gray-300 rounded-none py-3 px-4 text-gray-900 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 placeholder-gray-400" />
              <button type="submit" disabled={addingEra} className="bg-gray-900 text-white px-8 py-3 uppercase text-xs font-bold tracking-wider hover:bg-gray-800 transition-colors disabled:bg-gray-400 whitespace-nowrap">
                {addingEra ? "Adding..." : "Add Era Tag"}
              </button>
            </form>
            <div>
              <h3 className={`text-xl font-bold italic mb-4 border-b border-gray-300 pb-2 ${merriweather.className}`}>Current Era Taxonomy</h3>
              <div className="space-y-3">
                {eras.map((eraRecord) => (
                  <div key={eraRecord.id} className="flex justify-between items-center p-4 border border-gray-300 bg-white group hover:border-gray-900 transition-colors">
                    <span className="font-bold text-gray-900">{eraRecord.name}</span>
                    <button onClick={() => handleDeleteEra(eraRecord.id)} className="text-red-600 hover:text-red-800 uppercase text-xs font-bold tracking-wider transition-colors opacity-0 group-hover:opacity-100">Delete Tag</button>
                  </div>
                ))}
                {eras.length === 0 && <p className="text-gray-500 italic py-8 text-center border border-dashed border-gray-300">No era tags configured yet.</p>}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: MANAGE KEYWORDS */}
        {activeTab === "keywords" && (
          <div className="space-y-10">
            <form onSubmit={handleAddKeyword} className="flex flex-col md:flex-row gap-4">
              <input type="text" required placeholder="Featured Keyword (e.g. POW/MIA)" value={newKeywordName ?? ""} onChange={e => setNewKeywordName(e.target.value)} className="flex-grow bg-white border border-gray-300 rounded-none py-3 px-4 text-gray-900 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 placeholder-gray-400" />
              <button type="submit" disabled={addingKeyword} className="bg-gray-900 text-white px-8 py-3 uppercase text-xs font-bold tracking-wider hover:bg-gray-800 transition-colors disabled:bg-gray-400 whitespace-nowrap">
                {addingKeyword ? "Adding..." : "Add Keyword"}
              </button>
            </form>
            <div>
              <div className="mb-4 border-b border-gray-300 pb-2">
                <h3 className={`text-xl font-bold italic ${merriweather.className}`}>Homepage Keywords</h3>
                <p className="text-sm text-gray-500 mt-1">These are the specific keywords displayed as buttons on the homepage.</p>
              </div>
              <div className="space-y-3">
                {featuredKeywords.map((keywordRecord) => (
                  <div key={keywordRecord.id} className="flex justify-between items-center p-4 border border-gray-300 bg-white group hover:border-gray-900 transition-colors">
                    <span className="font-bold text-gray-900">{keywordRecord.name}</span>
                    <button onClick={() => handleDeleteKeyword(keywordRecord.id)} className="text-red-600 hover:text-red-800 uppercase text-xs font-bold tracking-wider transition-colors opacity-0 group-hover:opacity-100">Remove from Home</button>
                  </div>
                ))}
                {featuredKeywords.length === 0 && <p className="text-gray-500 italic py-8 text-center border border-dashed border-gray-300">No homepage keywords configured yet.</p>}
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}