import React, { useState, useEffect } from "react";
import { 
  Play, 
  Volume2, 
  Maximize, 
  Share2, 
  MoreHorizontal, 
  CheckCircle2,
  Eye,
  Heart,
  Calendar,
  ArrowLeft,
  FastForward,
  List,
  ChevronRight
} from "lucide-react";
import { cn } from "../lib/utils";
import { db } from "../lib/firebase";
import { doc, getDoc, onSnapshot } from "firebase/firestore";

interface VODViewProps {
  user: any;
  vodId: string;
  onBack: () => void;
}

export default function VODView({ user, vodId, onBack }: VODViewProps) {
  const [vodData, setVodData] = useState<any>(null);
  const [creatorData, setCreatorData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration] = useState(2712); // 45:12 in seconds
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  const chapters = [
    { time: 0, title: "Introduction" },
    { time: 300, title: "Setting up the Environment" },
    { time: 900, title: "Core Logic Implementation" },
    { time: 1800, title: "Styling with Tailwind" },
    { time: 2400, title: "Q&A and Wrap up" }
  ];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    setCurrentTime(percentage * duration);
  };

  useEffect(() => {
    const fetchVOD = async () => {
      try {
        const vRef = doc(db, "vods", vodId);
        const vSnap = await getDoc(vRef);
        if (vSnap.exists()) {
          const data = vSnap.data();
          setVodData(data);
          
          // Fetch creator data
          const uRef = doc(db, "users", data.creatorId);
          const uSnap = await getDoc(uRef);
          if (uSnap.exists()) {
            setCreatorData(uSnap.data());
          }
        }
      } catch (error) {
        console.error("Failed to fetch VOD:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVOD();
  }, [vodId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!vodData) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <h2 className="text-2xl font-bold">VOD Not Found</h2>
        <button onClick={onBack} className="text-primary font-bold hover:underline">Go Back</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface p-6">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors mb-6 group"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span className="font-bold">Back to Profile</span>
      </button>

      <div className="max-w-6xl mx-auto space-y-6">
        <div className="relative aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl group">
          <img 
            className="w-full h-full object-cover opacity-60" 
            src={vodData.thumbnailURL || `https://picsum.photos/seed/${vodId}/1920/1080`} 
            alt="VOD Thumbnail"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center hover:scale-110 transition-transform cursor-pointer group/play">
              <Play className="w-10 h-10 text-primary fill-primary group-hover/play:scale-110 transition-transform" />
            </div>
          </div>
          
          {/* Controls Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div 
              className="w-full bg-on-surface-variant/20 h-1.5 rounded-full mb-6 relative cursor-pointer group/progress"
              onClick={handleProgressClick}
            >
              <div 
                className="absolute left-0 top-0 h-full bg-primary rounded-full shadow-[0_0_12px_#b89fff] transition-all duration-300"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              ></div>
              
              {/* Chapter Markers */}
              {chapters.map((chapter, idx) => (
                <div 
                  key={idx}
                  className="absolute top-1/2 -translate-y-1/2 w-1 h-3 bg-white/40 hover:bg-white transition-colors z-20"
                  style={{ left: `${(chapter.time / duration) * 100}%` }}
                  title={chapter.title}
                />
              ))}
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
                <span className="text-sm font-medium text-white tracking-wide">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
              <div className="flex items-center gap-6 relative">
                <div className="relative">
                  <button 
                    onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                    className="flex items-center gap-1 text-sm font-bold text-white hover:text-primary transition-colors"
                  >
                    <FastForward className="w-4 h-4" />
                    {playbackSpeed}x
                  </button>
                  
                  {showSpeedMenu && (
                    <div className="absolute bottom-full right-0 mb-2 bg-surface-container-highest rounded-lg overflow-hidden shadow-xl border border-outline-variant/20 min-w-[80px] z-50">
                      {[0.5, 1, 1.25, 1.5, 2].map(speed => (
                        <button
                          key={speed}
                          onClick={() => {
                            setPlaybackSpeed(speed);
                            setShowSpeedMenu(false);
                          }}
                          className={cn(
                            "w-full px-4 py-2 text-xs font-bold text-left hover:bg-primary/20 transition-colors",
                            playbackSpeed === speed ? "text-primary bg-primary/10" : "text-on-surface"
                          )}
                        >
                          {speed}x
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-sm font-bold text-white hover:text-primary cursor-pointer">1080p</span>
                <Maximize className="w-6 h-6 text-white cursor-pointer hover:text-primary transition-colors" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">{vodData.title}</h1>
              <div className="flex items-center gap-3">
                <span className="text-primary-dim font-bold text-sm">{vodData.category}</span>
                <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                <div className="flex items-center gap-1 text-on-surface-variant text-sm font-medium">
                  <Eye className="w-4 h-4" />
                  {vodData.views || 0} views
                </div>
                <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                <div className="flex items-center gap-1 text-on-surface-variant text-sm font-medium">
                  <Calendar className="w-4 h-4" />
                  {new Date(vodData.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 bg-surface-container-high hover:bg-surface-container-highest px-4 py-2 rounded-lg text-sm font-bold transition-all">
                <Heart className="w-4 h-4" /> Like
              </button>
              <button className="flex items-center gap-2 bg-surface-container-high hover:bg-surface-container-highest px-4 py-2 rounded-lg text-sm font-bold transition-all">
                <Share2 className="w-4 h-4" /> Share
              </button>
              <button className="flex items-center gap-2 bg-surface-container-high hover:bg-surface-container-highest px-4 py-2 rounded-lg text-sm font-bold transition-all">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-surface-container flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img 
                  alt="Creator" 
                  className="w-14 h-14 rounded-full border-2 border-primary" 
                  src={creatorData?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${vodData.creatorId}`} 
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
            <button className="bg-gradient-to-br from-primary to-primary-container text-on-primary-container px-8 py-2.5 rounded-lg font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
              Follow Creator
            </button>
          </div>
        </div>

        {/* Chapters Sidebar */}
        <div className="space-y-4">
          <div className="bg-surface-container p-6 rounded-xl border border-outline-variant/10">
            <h3 className="font-headline font-bold text-on-surface flex items-center gap-2 mb-4">
              <List className="w-5 h-5 text-primary" />
              Chapters
            </h3>
            <div className="space-y-2">
              {chapters.map((chapter, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentTime(chapter.time)}
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-lg transition-all group",
                    currentTime >= chapter.time && (idx === chapters.length - 1 || currentTime < chapters[idx + 1].time)
                      ? "bg-primary/10 border border-primary/20"
                      : "hover:bg-surface-container-highest border border-transparent"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded",
                      currentTime >= chapter.time && (idx === chapters.length - 1 || currentTime < chapters[idx + 1].time)
                        ? "bg-primary text-on-primary"
                        : "bg-surface-container-highest text-on-surface-variant"
                    )}>
                      {formatTime(chapter.time)}
                    </span>
                    <span className="text-sm font-medium text-on-surface group-hover:text-primary transition-colors">
                      {chapter.title}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-on-surface-variant group-hover:text-primary transition-transform group-hover:translate-x-1" />
                </button>
              ))}
            </div>
          </div>

          <div className="bg-surface-container p-6 rounded-xl border border-outline-variant/10">
            <h3 className="font-headline font-bold text-on-surface mb-2">About this Broadcast</h3>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              {vodData.description || "This broadcast was recorded live on Stremo. Join the community to interact with creators in real-time!"}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
);
}
