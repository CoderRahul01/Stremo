import { useState, useEffect } from "react";
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider,
  User
} from "firebase/auth";
import { auth, db } from "./lib/firebase";
import { doc, getDoc, setDoc, collection, query, where, onSnapshot } from "firebase/firestore";
import { Radio, Play } from "lucide-react";

import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import LiveDashboard from "./components/LiveDashboard";
import StreamView from "./components/StreamView";
import Profile from "./components/Profile";
import VODView from "./components/VODView";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState("dashboard");
  const [liveStreams, setLiveStreams] = useState<any[]>([]);
  const [selectedStreamId, setSelectedStreamId] = useState<string | null>(null);
  const [selectedVODId, setSelectedVODId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        
        const userRef = doc(db, "users", firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          setUserData(userSnap.data());
        } else {
          const newUserData = {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName,
            email: firebaseUser.email,
            photoURL: firebaseUser.photoURL,
            bio: "",
            followersCount: 0,
            followingCount: 0,
            totalStreamHours: 0,
            totalVideos: 0,
            isMonetized: false,
            currentRole: "user",
            role: "user",
          };
          await setDoc(userRef, newUserData);
          setUserData(newUserData);
        }
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch live streams
  useEffect(() => {
    const q = query(collection(db, "streams"), where("status", "==", "live"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const streams = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLiveStreams(streams);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-primary font-headline font-bold animate-pulse">Initializing Stremo...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Background Glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] -z-10"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-tertiary/20 rounded-full blur-[120px] -z-10"></div>

        <div className="max-w-md w-full text-center space-y-8">
          <div className="space-y-2">
            <h1 className="text-6xl font-black italic tracking-tighter text-primary font-headline">Stremo</h1>
            <p className="text-on-surface-variant font-medium">The Electric Kineticist Streaming Platform</p>
          </div>

          <div className="bg-surface-container p-8 rounded-3xl border border-outline-variant/10 shadow-2xl space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Welcome Back</h2>
              <p className="text-sm text-on-surface-variant">Start your streaming journey in seconds.</p>
            </div>

            <button 
              onClick={handleLogin}
              className="w-full py-4 bg-white text-black font-bold rounded-xl flex items-center justify-center gap-3 hover:bg-neutral-200 transition-colors active:scale-95"
            >
              <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
              Continue with Google
            </button>

            <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">
              By continuing, you agree to Stremo's Terms of Service
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        user={userData || user} 
        onNavigate={setActivePage} 
        onRoleSwitch={async (role) => {
          const newUserData = { ...userData, currentRole: role };
          setUserData(newUserData);
          await setDoc(doc(db, "users", user.uid), newUserData);
          // Force navigate to appropriate home
          setActivePage("dashboard");
        }}
      />
      <Sidebar 
        activePage={activePage} 
        onNavigate={setActivePage} 
        currentRole={userData?.currentRole || "user"}
      />
      
      <main className="md:ml-64 pt-16 min-h-[calc(100vh-64px)]">
        {activePage === "dashboard" && (
          userData?.currentRole === "streamer" 
            ? <LiveDashboard user={userData || user} />
            : <div className="p-8">
                <h1 className="text-3xl font-headline font-extrabold mb-8">Recommended Streams</h1>
                {liveStreams.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {liveStreams.map((stream) => (
                      <div 
                        key={stream.id}
                        onClick={() => {
                          setSelectedStreamId(stream.id);
                          setActivePage("stream");
                        }}
                        className="bg-surface-container rounded-xl overflow-hidden group cursor-pointer border border-outline-variant/10 hover:border-primary/30 transition-all"
                      >
                        <div className="aspect-video relative">
                          <img 
                            src={stream.thumbnailURL || `https://picsum.photos/seed/${stream.id}/640/360`} 
                            alt="Thumbnail" 
                            className="w-full h-full object-cover" 
                          />
                          <div className="absolute top-2 left-2 bg-error px-2 py-0.5 rounded text-[10px] font-black uppercase flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                            Live
                          </div>
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Play className="w-12 h-12 text-white fill-white" />
                          </div>
                        </div>
                        <div className="p-4 flex gap-3">
                          <div className="w-10 h-10 rounded-full bg-surface-container-highest flex-shrink-0 overflow-hidden">
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${stream.creatorId}`} alt="Avatar" />
                          </div>
                          <div className="space-y-1">
                            <h3 className="font-bold text-sm line-clamp-1 group-hover:text-primary transition-colors">{stream.title}</h3>
                            <p className="text-xs text-on-surface-variant">{stream.category || "Gaming"}</p>
                            <p className="text-[10px] text-on-surface-variant uppercase font-bold">{stream.viewerCount || 0} viewers</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                    <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center">
                      <Radio className="w-10 h-10 text-primary opacity-20" />
                    </div>
                    <h2 className="text-xl font-bold">No one is live right now</h2>
                    <p className="text-on-surface-variant max-w-xs">
                      Be the first one to start a stream! Switch to Streamer mode in the header.
                    </p>
                  </div>
                )}
              </div>
        )}
        {activePage === "stream" && <StreamView user={userData || user} streamId={selectedStreamId || "test-stream"} />}
        {activePage === "vod" && (
          <VODView 
            user={userData || user} 
            vodId={selectedVODId || ""} 
            onBack={() => setActivePage("profile")} 
          />
        )}
        {activePage === "profile" && (
          <Profile 
            user={userData || user} 
            onUpdate={setUserData} 
            onViewVOD={(id) => {
              setSelectedVODId(id);
              setActivePage("vod");
            }}
          />
        )}
        
        {/* Fallback for other pages */}
        {["trending", "shorts", "subscriptions", "library"].includes(activePage) && (
          <div className="flex flex-col items-center justify-center h-full p-12 text-center space-y-4">
            <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center">
              <Radio className="w-10 h-10 text-primary opacity-20" />
            </div>
            <h2 className="text-2xl font-bold">Coming Soon</h2>
            <p className="text-on-surface-variant max-w-sm">
              We're currently focusing on the core streaming experience. This feature is on our roadmap!
            </p>
            <button 
              onClick={() => setActivePage("dashboard")}
              className="text-primary font-bold hover:underline"
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
