import { useState, useEffect, useRef } from "react";
import { 
  Radio, 
  Mic, 
  Video, 
  Settings, 
  Copy, 
  Edit2, 
  Bolt, 
  Monitor, 
  TrendingUp,
  Share2,
  MoreHorizontal,
  CheckCircle2,
  Users,
  Heart
} from "lucide-react";
import { cn } from "../lib/utils";
import Chat from "./Chat";
import StremoAvatar from "./Avatar";
import { io, Socket } from "socket.io-client";
import { db } from "../lib/firebase";
import { doc, setDoc } from "firebase/firestore";

interface LiveDashboardProps {
  user: any;
}

export default function LiveDashboard({ user }: LiveDashboardProps) {
  const [isLive, setIsLive] = useState(false);
  const [notification, setNotification] = useState<any>(null);
  const [stats, setStats] = useState({ viewerCount: 0, likesCount: 0 });
  const [streamTitle, setStreamTitle] = useState("Late Night Coding & Chill Lo-fi Beats 💻");
  const [isSaving, setIsSaving] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [lowLatency, setLowLatency] = useState(true);
  const [hdQuality, setHdQuality] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showIframeWarning, setShowIframeWarning] = useState(false);
  
  const socketRef = useRef<Socket | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isLive && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isLive]);

  useEffect(() => {
    socketRef.current = io();
    const socket = socketRef.current;

    const streamId = `stream_${user.uid}`;
    socket.emit("join-stream", { 
      streamId: streamId, 
      userId: user.uid, 
      userName: user.displayName 
    });

    socket.on("stats-update", (newStats: any) => {
      setStats(newStats);
    });

    return () => {
      stopCamera();
      socket.disconnect();
    };
  }, [user]);

  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Media devices not supported in this browser/context.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      return true;
    } catch (err: any) {
      console.error("Error accessing media devices:", err);
      const isInIframe = window.self !== window.top;
      
      setNotification({
        type: "error",
        userName: "System",
        message: isInIframe 
          ? "Camera blocked in preview. Opening in a new tab is required for real streaming."
          : "Camera denied. Using simulated stream for demo."
      });

      if (isInIframe) {
        setShowIframeWarning(true);
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      
      setTimeout(() => setNotification(null), 8000);
      return !isInIframe; 
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Switch back to camera
      stopCamera();
      const success = await startCamera();
      if (success) {
        setIsScreenSharing(false);
        setNotification({
          type: "info",
          userName: "System",
          message: "Switched back to camera!"
        });
      }
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });
        
        // Listen for when the user stops sharing via browser UI
        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          startCamera(); 
        };

        if (streamRef.current) {
          const videoTrack = screenStream.getVideoTracks()[0];
          const oldVideoTrack = streamRef.current.getVideoTracks()[0];
          if (oldVideoTrack) {
            streamRef.current.removeTrack(oldVideoTrack);
            oldVideoTrack.stop(); 
            streamRef.current.addTrack(videoTrack);
          }
        } else {
          streamRef.current = screenStream;
        }

        if (videoRef.current) {
          videoRef.current.srcObject = streamRef.current;
        }

        setIsScreenSharing(true);
        setNotification({
          type: "info",
          userName: "System",
          message: "Screen sharing started!"
        });
      } catch (err) {
        console.error("Error starting screen share:", err);
      }
    }
    setTimeout(() => setNotification(null), 3000);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const toggleLive = async () => {
    const newLiveState = !isLive;
    
    if (newLiveState) {
      const success = await startCamera();
      if (!success) return; // Don't go live if camera fails
    } else {
      stopCamera();
    }

    setIsLive(newLiveState);

    // Sync to Firestore
    try {
      const streamId = `stream_${user.uid}`;
      const sRef = doc(db, "streams", streamId);
      await setDoc(sRef, {
        id: streamId,
        creatorId: user.uid,
        title: streamTitle,
        status: newLiveState ? "live" : "offline",
        startedAt: newLiveState ? new Date().toISOString() : null,
        category: "Coding"
      }, { merge: true });

      // Save VOD if ending stream
      if (!newLiveState) {
        const vodId = `vod_${user.uid}_${Date.now()}`;
        const vRef = doc(db, "vods", vodId);
        await setDoc(vRef, {
          id: vodId,
          creatorId: user.uid,
          title: streamTitle,
          category: "Coding",
          createdAt: new Date().toISOString(),
          views: 0,
          thumbnailURL: `https://picsum.photos/seed/${vodId}/640/360`
        });
        
        setNotification({
          type: "info",
          userName: "System",
          message: "Broadcast saved as VOD!"
        });
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (error) {
      console.error("Failed to sync live status:", error);
      setNotification({
        type: "error",
        userName: "System",
        message: "Failed to sync live status. Please check your connection."
      });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const toggleMic = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isMicOn;
        setIsMicOn(!isMicOn);
      }
    }
  };

  const toggleCam = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isCamOn;
        setIsCamOn(!isCamOn);
      }
    }
  };

  const copyStreamKey = () => {
    const key = `sk_live_${user.uid.slice(0, 8)}_${Math.random().toString(36).slice(2, 7)}`;
    navigator.clipboard.writeText(key);
    setNotification({
      type: "info",
      userName: "System",
      message: "Stream Key copied to clipboard!"
    });
    setTimeout(() => setNotification(null), 3000);
  };

  const shareStream = () => {
    const url = `${window.location.origin}/stream/${user.uid}`;
    navigator.clipboard.writeText(url);
    setNotification({
      type: "info",
      userName: "System",
      message: "Stream link copied to clipboard!"
    });
    setTimeout(() => setNotification(null), 3000);
  };

  const saveStreamSettings = async () => {
    setIsSaving(true);
    try {
      const streamId = `stream_${user.uid}`;
      const sRef = doc(db, "streams", streamId);
      await setDoc(sRef, {
        id: streamId,
        creatorId: user.uid,
        title: streamTitle,
        status: isLive ? "live" : "offline",
        viewerCount: stats.viewerCount,
        likesCount: stats.likesCount,
        category: "Coding",
        startedAt: isLive ? new Date().toISOString() : null
      }, { merge: true });
    } catch (error) {
      console.error("Failed to save stream settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDonation = (data: any) => {
    setNotification({
      type: "donation",
      userName: data.userName,
      message: `Just donated $${data.amount}! "${data.message}"`,
    });
    setTimeout(() => setNotification(null), 5000);
  };

  return (
    <div className="min-h-screen bg-background text-on-background pb-20 md:pb-8">
      <main className="pt-24 px-4 md:px-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-8 space-y-6">
          {/* Preview Container */}
          <section className="relative bg-surface-container-lowest rounded-xl overflow-hidden aspect-video shadow-2xl group border border-outline-variant/10">
            {isLive ? (
              <div className="w-full h-full relative">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  muted 
                  playsInline 
                  className="w-full h-full object-cover"
                />
                {!streamRef.current && (
                  <div className="absolute inset-0 bg-surface-container-lowest flex flex-col items-center justify-center space-y-4">
                    <img 
                      alt="Mock Stream" 
                      className="w-full h-full object-cover opacity-40 absolute inset-0" 
                      src="https://picsum.photos/seed/streaming/1280/720" 
                    />
                    <div className="relative z-10 flex flex-col items-center text-center p-6">
                      <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-2">
                        <Video className="w-8 h-8 text-primary" />
                      </div>
                      <p className="text-sm font-bold text-primary">Simulated Stream Active</p>
                      <p className="text-[10px] text-on-surface-variant max-w-[200px]">Camera blocked in preview. Open in new tab for real hardware access.</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <img 
                alt="Stream Preview" 
                className="w-full h-full object-cover opacity-80" 
                src="https://picsum.photos/seed/studio/1280/720" 
              />
            )}
            <div className="absolute top-4 left-4 flex gap-2">
              <div className="bg-surface-container-highest/60 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-2 border border-outline-variant/20">
                <Video className="w-3 h-3 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-widest">{isLive ? "Live Broadcast" : "Preview Mode"}</span>
              </div>
              <div className="bg-surface-container-highest/60 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-2 border border-outline-variant/20">
                <div className={cn("w-2 h-2 rounded-full animate-pulse", isLive ? "bg-error" : "bg-tertiary")}></div>
                <span className="text-[10px] font-bold uppercase tracking-widest">{isLive ? "On Air" : "Ready"}</span>
              </div>
              {window.self !== window.top && (
                <button 
                  onClick={() => window.open(window.location.href, '_blank')}
                  className="bg-primary/20 hover:bg-primary/30 text-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-primary/30 transition-colors"
                >
                  Open in New Tab
                </button>
              )}
            </div>
            
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-surface-container-low/80 backdrop-blur-xl p-2 rounded-full border border-outline-variant/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button 
                onClick={toggleMic}
                className={cn("w-12 h-12 rounded-full flex items-center justify-center transition-colors", isMicOn ? "bg-surface-variant hover:bg-surface-container-highest" : "bg-error/20 text-error hover:bg-error/30")}
              >
                <Mic className="w-5 h-5" />
              </button>
              <button 
                onClick={toggleCam}
                className={cn("w-12 h-12 rounded-full flex items-center justify-center transition-colors", isCamOn ? "bg-surface-variant hover:bg-surface-container-highest" : "bg-error/20 text-error hover:bg-error/30")}
              >
                <Video className="w-5 h-5" />
              </button>
              <button 
                onClick={toggleScreenShare}
                className={cn("w-12 h-12 rounded-full flex items-center justify-center transition-colors", isScreenSharing ? "bg-primary text-on-primary" : "bg-surface-variant hover:bg-surface-container-highest")}
                title={isScreenSharing ? "Stop Screen Share" : "Share Screen"}
              >
                <Monitor className="w-5 h-5" />
              </button>
              <button className="w-12 h-12 rounded-full flex items-center justify-center bg-surface-variant hover:bg-surface-container-highest transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </section>

          {/* Action Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 bg-kinetic-gradient p-[1px] rounded-xl overflow-hidden active:scale-[0.98] transition-transform duration-200">
              <button 
                onClick={toggleLive}
                className="w-full h-16 bg-background rounded-[11px] flex items-center justify-center gap-3 hover:bg-transparent transition-colors group"
              >
                <Radio className={cn("w-8 h-8 group-hover:text-on-primary transition-colors", isLive ? "text-error" : "text-primary")} />
                <span className={cn("font-headline font-extrabold text-xl tracking-tight group-hover:text-on-primary transition-colors", isLive ? "text-error" : "text-on-surface")}>
                  {isLive ? "End Stream" : "Go Live Now"}
                </span>
              </button>
            </div>
            <div className="bg-surface-container rounded-xl p-4 flex items-center justify-between border border-outline-variant/10">
              <div className="flex flex-col">
                <span className="text-on-surface-variant text-[10px] uppercase font-bold tracking-widest">Stream Key</span>
                <span className="text-on-surface font-mono text-xs truncate max-w-[120px]">sk_live_••••••••</span>
              </div>
              <button 
                onClick={copyStreamKey}
                className="p-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest transition-colors"
              >
                <Copy className="w-4 h-4 text-primary" />
              </button>
            </div>
            <div className="bg-surface-container rounded-xl p-4 flex items-center justify-between border border-outline-variant/10">
              <div className="flex flex-col">
                <span className="text-on-surface-variant text-[10px] uppercase font-bold tracking-widest">Share Stream</span>
                <span className="text-on-surface font-mono text-xs truncate max-w-[120px]">stremo.live/{user.uid.slice(0,8)}</span>
              </div>
              <button 
                onClick={shareStream}
                className="p-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest transition-colors"
              >
                <Share2 className="w-4 h-4 text-primary" />
              </button>
            </div>
          </div>

          {/* Dashboard Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-surface-container p-6 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-headline font-bold text-on-surface">Stream Identity</h3>
                <Edit2 className="w-4 h-4 text-on-surface-variant cursor-pointer" />
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-2">Title</label>
                  <div className="flex gap-2">
                    <input 
                      className="flex-1 bg-surface-container-low border-b-2 border-primary outline-none px-0 py-2 text-on-surface font-medium focus:ring-0" 
                      value={streamTitle}
                      onChange={(e) => setStreamTitle(e.target.value)}
                    />
                    <button 
                      onClick={saveStreamSettings}
                      disabled={isSaving}
                      className="px-4 py-1 bg-surface-container-highest text-xs font-bold rounded-lg hover:bg-surface-variant transition-colors disabled:opacity-50"
                    >
                      {isSaving ? "Saving..." : "Update"}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-2">Category</label>
                  <div className="flex gap-2 flex-wrap">
                    <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full border border-primary/20">Coding</span>
                    <span className="px-3 py-1 bg-surface-container-highest text-on-surface-variant text-xs font-bold rounded-full cursor-pointer hover:bg-primary/20 hover:text-primary transition-colors">Software Dev</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-surface-container p-6 rounded-xl space-y-4">
              <h3 className="font-headline font-bold text-on-surface">Performance Tuning</h3>
              <div className="space-y-4">
                <div 
                  onClick={() => setLowLatency(!lowLatency)}
                  className="flex items-center justify-between p-3 bg-surface-container-low rounded-lg cursor-pointer hover:bg-surface-container-high transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Bolt className="w-4 h-4 text-primary-dim" />
                    <span className="text-sm font-medium">Ultra-Low Latency</span>
                  </div>
                  <div className={cn("w-10 h-5 rounded-full relative transition-colors", lowLatency ? "bg-primary" : "bg-surface-container-highest")}>
                    <div className={cn("absolute top-1 w-3 h-3 bg-white rounded-full transition-all", lowLatency ? "right-1" : "left-1")}></div>
                  </div>
                </div>
                <div 
                  onClick={() => setHdQuality(!hdQuality)}
                  className="flex items-center justify-between p-3 bg-surface-container-low rounded-lg cursor-pointer hover:bg-surface-container-high transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Monitor className="w-4 h-4 text-primary-dim" />
                    <span className="text-sm font-medium">1080p HD Quality</span>
                  </div>
                  <div className={cn("w-10 h-5 rounded-full relative transition-colors", hdQuality ? "bg-primary" : "bg-surface-container-highest")}>
                    <div className={cn("absolute top-1 w-3 h-3 bg-white rounded-full transition-all", hdQuality ? "right-1" : "left-1")}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-surface-container-high p-6 rounded-xl">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-4">Connection Health</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] text-on-surface-variant/70 uppercase">Viewers</span>
                <div className="flex items-center gap-2">
                  <Users className="w-3 h-3 text-primary" />
                  <span className="text-xs font-bold text-on-surface">{stats.viewerCount}</span>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-on-surface-variant/70 uppercase">Likes</span>
                <div className="flex items-center gap-2">
                  <Heart className="w-3 h-3 text-tertiary fill-tertiary" />
                  <span className="text-xs font-bold text-on-surface">{stats.likesCount}</span>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-on-surface-variant/70 uppercase">Upload</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-on-surface">6.2 <span className="text-[10px] font-normal opacity-60">Mbps</span></span>
                  <TrendingUp className="w-3 h-3 text-tertiary" />
                </div>
              </div>
            </div>
          </div>

          <div className="h-[450px]">
            <Chat 
              streamId={`stream_${user.uid}`} 
              currentUser={user} 
              onDonation={handleDonation}
            />
          </div>

          <div className="bg-surface-container p-6 rounded-xl border border-primary/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
            <h4 className="font-headline font-bold text-sm mb-2 text-primary">Pro Tip</h4>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Stremo optimizes your stream for the Indian audience by automatically selecting the closest CDN edge node for <span className="text-on-surface font-bold">zero-lag playback.</span>
            </p>
          </div>
        </div>
      </main>

      <StremoAvatar notification={notification} />

      {showIframeWarning && (
        <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-2xl flex items-center justify-center p-6 text-center">
          <div className="max-w-md space-y-6">
            <div className="w-20 h-20 bg-error/20 rounded-full flex items-center justify-center mx-auto">
              <Video className="w-10 h-10 text-error" />
            </div>
            <h2 className="text-3xl font-headline font-black tracking-tighter">Permissions Blocked</h2>
            <p className="text-on-surface-variant leading-relaxed">
              Browsers block camera access inside preview windows for security. To start your stream, you must open Stremo in a new browser tab.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => window.open(window.location.href, '_blank')}
                className="w-full py-4 bg-primary text-on-primary font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform"
              >
                Open in New Tab
              </button>
              <button 
                onClick={() => setShowIframeWarning(false)}
                className="w-full py-4 bg-surface-container-highest text-on-surface font-bold rounded-xl hover:bg-surface-variant transition-colors"
              >
                Continue with Mock Stream
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
