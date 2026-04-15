import { useState, useEffect, useRef } from "react";
import { 
  Play, 
  Volume2, 
  Maximize, 
  Share2, 
  MoreHorizontal, 
  CheckCircle2,
  Users,
  Eye,
  Heart,
  UserPlus,
  Radio
} from "lucide-react";
import { cn } from "../lib/utils";
import Chat from "./Chat";
import { io, Socket } from "socket.io-client";
import { db } from "../lib/firebase";
import { doc, getDoc, onSnapshot } from "firebase/firestore";

interface StreamViewProps {
  user: any;
  streamId: string;
}

export default function StreamView({ user, streamId }: StreamViewProps) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [stats, setStats] = useState({ viewerCount: 0, likesCount: 0 });
  const [streamData, setStreamData] = useState<any>(null);
  const [creatorData, setCreatorData] = useState<any>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Fetch stream metadata
    const streamRef = doc(db, "streams", streamId);
    const unsubscribeStream = onSnapshot(streamRef, async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setStreamData(data);
        
        // Fetch creator data
        const userRef = doc(db, "users", data.creatorId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setCreatorData(userSnap.data());
        }
      }
    });

    socketRef.current = io();
    const socket = socketRef.current;

    socket.emit("join-stream", { 
      streamId: streamId, 
      userId: user.uid, 
      userName: user.displayName 
    });

    socket.on("stats-update", (newStats: any) => {
      setStats(newStats);
    });

    return () => {
      unsubscribeStream();
      socket.emit("leave-stream", streamId);
      socket.disconnect();
    };
  }, [user, streamId]);

  const handleLike = () => {
    socketRef.current?.emit("like-stream", streamId);
  };

  return (
    <div className="min-h-screen bg-surface">
      <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] overflow-hidden">
        {/* Video Player Column */}
        <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar p-6">
          <div className="relative aspect-video bg-surface-container-lowest rounded-xl overflow-hidden group shadow-2xl">
            {streamData?.status === "live" ? (
              <div className="w-full h-full bg-black flex items-center justify-center">
                <img 
                  className="w-full h-full object-cover opacity-60" 
                  src={streamData.thumbnailURL || `https://picsum.photos/seed/${streamId}/1920/1080`} 
                  alt="Stream"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                  <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center animate-pulse">
                    <Radio className="w-10 h-10 text-primary" />
                  </div>
                  <p className="text-primary font-headline font-bold text-xl tracking-widest uppercase">Live Stream Active</p>
                  <p className="text-on-surface-variant text-sm">Receiving data packets from {creatorData?.displayName || "Creator"}...</p>
                </div>
              </div>
            ) : (
              <div className="w-full h-full bg-surface-container flex flex-col items-center justify-center space-y-4">
                <Radio className="w-16 h-16 text-on-surface-variant opacity-20" />
                <h2 className="text-2xl font-bold">Stream is Offline</h2>
                <p className="text-on-surface-variant">This creator is not live right now.</p>
              </div>
            )}
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="w-full bg-on-surface-variant/20 h-1 rounded-full mb-6 relative">
                <div className="absolute left-0 top-0 h-full w-2/3 bg-primary rounded-full shadow-[0_0_12px_#b89fff]"></div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <Play className="w-6 h-6 text-white cursor-pointer hover:text-primary transition-colors" />
                  <div className="flex items-center gap-3">
                    <Volume2 className="w-6 h-6 text-white cursor-pointer hover:text-primary transition-colors" />
                    <div className="w-24 h-1 bg-on-surface-variant/40 rounded-full overflow-hidden">
                      <div className="w-3/4 h-full bg-white"></div>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-white tracking-wide">Live</span>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-1.5 bg-surface-container-high/60 px-3 py-1 rounded-lg">
                    <div className={cn("w-2 h-2 rounded-full shadow-[0_0_8px_#ff97b8]", streamData?.status === "live" ? "bg-error animate-pulse" : "bg-on-surface-variant")}></div>
                    <span className="text-xs font-bold text-white uppercase tracking-tighter">{streamData?.status === "live" ? "Live" : "Offline"}</span>
                  </div>
                  <span className="text-sm font-bold text-white hover:text-primary cursor-pointer">1080p</span>
                  <Maximize className="w-6 h-6 text-white cursor-pointer hover:text-primary transition-colors" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
              <div className="space-y-1">
                <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">{streamData?.title || "Stream Title"}</h1>
                <div className="flex items-center gap-3">
                  <span className="text-primary-dim font-bold text-sm">{streamData?.category || "Gaming"}</span>
                  <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                  <div className="flex items-center gap-1 text-on-surface-variant text-sm font-medium">
                    <Eye className="w-4 h-4" />
                    {stats.viewerCount} watching
                  </div>
                  <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                  <div className="flex items-center gap-1 text-on-surface-variant text-sm font-medium">
                    <Heart className="w-4 h-4" />
                    {stats.likesCount} likes
                  </div>
                  <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                  <span className="text-on-surface-variant text-sm">
                    {streamData?.startedAt ? `Started ${new Date(streamData.startedAt).toLocaleTimeString()}` : "Offline"}
                  </span>
                </div>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={handleLike}
                  className="flex items-center gap-2 bg-surface-container-high hover:bg-surface-container-highest px-4 py-2 rounded-lg text-sm font-bold transition-all text-tertiary"
                >
                  <Heart className="w-4 h-4 fill-tertiary" /> Like
                </button>
                <button className="flex items-center gap-2 bg-surface-container-high hover:bg-surface-container-highest px-4 py-2 rounded-lg text-sm font-bold transition-all">
                  <Share2 className="w-4 h-4" /> Share
                </button>
                <button className="flex items-center gap-2 bg-surface-container-high hover:bg-surface-container-highest px-4 py-2 rounded-lg text-sm font-bold transition-all">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="mt-8 p-6 rounded-xl bg-surface-container flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img 
                    alt="Creator" 
                    className="w-14 h-14 rounded-full border-2 border-primary" 
                    src={creatorData?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${streamData?.creatorId}`} 
                  />
                  <div className="absolute -bottom-1 -right-1 bg-primary text-on-primary text-[8px] font-black p-0.5 px-1 rounded">PRO</div>
                </div>
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-1.5">
                    {creatorData?.displayName || "Creator Name"}
                    <CheckCircle2 className="w-5 h-5 text-primary-fixed-dim fill-primary" />
                  </h2>
                  <p className="text-on-surface-variant text-sm">{creatorData?.followersCount || 0} followers • {creatorData?.bio || "Creator bio"}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button className="bg-surface-container-high border border-outline-variant/30 text-on-surface px-6 py-2.5 rounded-lg font-bold hover:bg-surface-container-highest transition-colors">Join Member</button>
                <button 
                  onClick={() => setIsSubscribed(!isSubscribed)}
                  className={cn(
                    "px-8 py-2.5 rounded-lg font-bold shadow-lg transition-all",
                    isSubscribed 
                      ? "bg-surface-container-highest text-on-surface" 
                      : "bg-gradient-to-br from-primary to-primary-container text-on-primary-container shadow-primary/20 hover:scale-[1.02] active:scale-95"
                  )}
                >
                  {isSubscribed ? "Subscribed" : "Subscribe"}
                </button>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 bg-surface-container-low p-6 rounded-xl space-y-4">
                <h3 className="text-lg font-bold">About the stream</h3>
                <p className="text-on-surface-variant text-sm leading-relaxed">
                  {streamData?.description || "No description provided for this stream."}
                </p>
                <div className="flex gap-2">
                  <span className="bg-surface-container-high px-3 py-1 rounded text-xs font-semibold text-primary">#javascript</span>
                  <span className="bg-surface-container-high px-3 py-1 rounded text-xs font-semibold text-primary">#coding</span>
                  <span className="bg-surface-container-high px-3 py-1 rounded text-xs font-semibold text-primary">#lofi</span>
                </div>
              </div>
              <div className="bg-surface-container-low p-6 rounded-xl flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold mb-2">Current Goal</h3>
                  <p className="text-xs text-on-surface-variant mb-4">Subscriber milestone</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-bold">
                    <span>{creatorData?.followersCount || 0} / 10k</span>
                    <span className="text-primary">{Math.min(100, Math.round(((creatorData?.followersCount || 0) / 10000) * 100))}%</span>
                  </div>
                  <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${Math.min(100, ((creatorData?.followersCount || 0) / 10000) * 100)}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Column */}
        <div className="w-full lg:w-96 glass-panel border-l border-outline-variant/10 flex flex-col">
          <Chat streamId={streamId} currentUser={user} />
        </div>
      </div>
    </div>
  );
}
