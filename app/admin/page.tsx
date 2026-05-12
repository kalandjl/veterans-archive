"use client";

import { useState, useEffect } from "react";
import { auth, provider, db, storage } from "@/lib/firebase/init";
import { useAuthState } from "react-firebase-hooks/auth";
import { signInWithPopup, signOut } from "firebase/auth";
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

interface ArchiveRecord {
  id: string;
  name: string;
  era: string;
  fileName: string;
  fileUrl: string;
  storagePath: string;
  createdAt?: any;
}

export default function AdminPage() {
  const [user, loading] = useAuthState(auth);
  const [activeTab, setActiveTab] = useState("upload"); 
  
  // Form State
  const [name, setName] = useState("");
  const [era, setEra] = useState("World War II");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  
  // Manage State
  const [records, setRecords] = useState<ArchiveRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  const DEV_EMAIL = process.env.NEXT_PUBLIC_DEV_EMAIL;
  
  useEffect(() => {
    console.log(user?.email, DEV_EMAIL)
    if (user) {
      if (user.email !== ADMIN_EMAIL && user.email !== DEV_EMAIL) {
        signOut(auth);
        alert("Unauthorized account.");
      }
    }
  }, [user, ADMIN_EMAIL, DEV_EMAIL]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login Error:", error);
    }
  };

  const handleLogout = () => signOut(auth);

  // --- UPLOAD LOGIC ---
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !name) return alert("Please provide a name and file.");
    
    setUploading(true);
    try {
      const storageRef = ref(storage, `archives/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      await addDoc(collection(db, "archives"), {
        name,
        era,
        fileName: file.name,
        fileUrl: downloadURL,
        storagePath: storageRef.fullPath, 
        createdAt: new Date()
      });

      alert("Upload successful!");
      setName("");
      setFile(null);
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = "";

    } catch (error) {
      console.error("Upload failed:", error);
      alert("Upload failed. See console.");
    }
    setUploading(false);
  };

  // --- FETCH & DELETE LOGIC ---
  const fetchRecords = async () => {
    const q = query(collection(db, "archives"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    })) as ArchiveRecord[];
    
    setRecords(data);
  };

  useEffect(() => {
    if (user && activeTab === "manage") {
      fetchRecords();
    }
  }, [user, activeTab]);

  const handleDelete = async (id: string, storagePath: string) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;

    try {
      await deleteDoc(doc(db, "archives", id));
      
      const fileRef = ref(storage, storagePath);
      await deleteObject(fileRef);

      setRecords(records.filter((record) => record.id !== id));
      alert("Record deleted.");
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete.");
    }
  };

  const filteredRecords = records.filter((r) => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- UI RENDER ---
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-900 font-medium">Loading...</div>;
  }

  // if (!user) {
  //   return (
  //     <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
  //       <h1 className="text-3xl font-bold mb-6 text-gray-900">Archive Admin Area</h1>
  //       <button onClick={handleLogin} className="bg-black text-white px-6 py-3 font-medium rounded shadow-sm hover:bg-gray-800 transition">
  //         Sign in with Google
  //       </button>
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white p-8 border border-gray-200 shadow-sm rounded">
        
        <div className="flex justify-between items-center mb-8 pb-4 border-b">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-800">{user.email}</span>
            <button onClick={handleLogout} className="text-sm text-red-700 font-bold hover:text-red-900 hover:underline transition">Logout</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          <button 
            onClick={() => setActiveTab("upload")} 
            className={`px-4 py-2 font-medium rounded transition ${activeTab === "upload" ? "bg-black text-white" : "bg-gray-200 text-gray-900 hover:bg-gray-300"}`}
          >
            Upload New
          </button>
          <button 
            onClick={() => setActiveTab("manage")} 
            className={`px-4 py-2 font-medium rounded transition ${activeTab === "manage" ? "bg-black text-white" : "bg-gray-200 text-gray-900 hover:bg-gray-300"}`}
          >
            Manage / Delete
          </button>
        </div>

        {/* Upload Form */}
        {activeTab === "upload" && (
          <form onSubmit={handleUpload} className="space-y-6">
            <div>
              <label className="block text-sm font-bold mb-2 text-gray-900">Veteran / Record Name</label>
              <input 
                type="text" required 
                value={name} onChange={e => setName(e.target.value)}
                className="w-full border border-gray-300 rounded p-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2 text-gray-900">Era</label>
              <select 
                value={era} onChange={e => setEra(e.target.value)}
                className="w-full border border-gray-300 rounded p-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option>World War II</option>
                <option>Korean War</option>
                <option>Vietnam War</option>
                <option>Gulf War (OEF/OIF)</option>
                <option>Peacetime Service</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2 text-gray-900">Media File (Letter, Photo, etc.)</label>
              <input 
                id="file-upload"
                type="file" required 
                onChange={e => {
                  if (!e.target.files) return;
                  setFile(e.target.files[0]);
                }}
                className="w-full text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-gray-200 file:text-gray-900 hover:file:bg-gray-300 transition"
              />
            </div>
            <button 
              type="submit" disabled={uploading}
              className="bg-black text-white px-8 py-3 rounded font-medium disabled:bg-gray-400 w-full hover:bg-gray-800 transition"
            >
              {uploading ? "Uploading..." : "Upload to Archive"}
            </button>
          </form>
        )}

        {/* Manage / Delete View */}
        {activeTab === "manage" && (
          <div>
            <input 
              type="text" 
              placeholder="Search by name..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded p-3 mb-6 text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-black"
            />
            
            <div className="space-y-4">
              {filteredRecords.map((record) => (
                <div key={record.id} className="flex justify-between items-center p-4 border border-gray-300 rounded bg-gray-50">
                  <div>
                    <h3 className="font-bold text-gray-900">{record.name}</h3>
                    <p className="text-sm font-medium text-gray-800 mt-1">{record.era} • {record.fileName}</p>
                  </div>
                  <div className="flex gap-4">
                    <a href={record.fileUrl} target="_blank" rel="noreferrer" className="text-blue-700 hover:text-blue-900 transition hover:underline text-sm font-bold">View File</a>
                    <button 
                      onClick={() => handleDelete(record.id, record.storagePath)}
                      className="text-red-700 hover:text-red-900 transition hover:underline text-sm font-bold"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {filteredRecords.length === 0 && <p className="text-gray-800 font-medium italic mt-4">No records found.</p>}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}