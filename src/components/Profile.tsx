import { useState, useEffect } from "react";
import { 
  User, 
  Mail, 
  Camera, 
  Shield, 
  Award, 
  Clock, 
  PlayCircle, 
  Users,
  CheckCircle2,
  Lock,
  Trash2,
  Edit
} from "lucide-react";
import { cn } from "../lib/utils";
import { db } from "../lib/firebase";
import { doc, setDoc, collection, query, where, getDocs, deleteDoc, orderBy } from "firebase/firestore";

interface ProfileProps {
  user: any;
  onUpdate: (data: any) => void;
  onViewVOD: (id: string) => void;
}

export default function Profile({ user, onUpdate, onViewVOD }: ProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [vods, setVods] = useState<any[]>([]);
  const [loadingVods, setLoadingVods] = useState(true);
  const [formData, setFormData] = useState({
    displayName: user.displayName || "",
    bio: user.bio || "",
    photoURL: user.photoURL || "",
  });

  useEffect(() => {
    fetchVods();
  }, [user.uid]);

  const fetchVods = async () => {
    setLoadingVods(true);
    try {
      const q = query(
        collection(db, "vods"), 
        where("creatorId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      const fetchedVods = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setVods(fetchedVods);
    } catch (error) {
      console.error("Failed to fetch VODs:", error);
    } finally {
      setLoadingVods(false);
    }
  };

  const deleteVOD = async (vodId: string) => {
    if (!confirm("Are you sure you want to delete this broadcast?")) return;
    try {
      await deleteDoc(doc(db, "vods", vodId));
      setVods(vods.filter(v => v.id !== vodId));
    } catch (error) {
      console.error("Failed to delete VOD:", error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const userRef = doc(db, "users", user.uid);
      const updatedData = { ...user, ...formData };
      await setDoc(userRef, updatedData);
      onUpdate(updatedData);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Reward stats (mocked for MVP)
  const stats = {
    hours: 45,
    videos: 12,
    followers: 850,
  };

  const monetizationGoals = {
    hours: 100,
    videos: 20,
    followers: 1000,
  };

  const isEligible = stats.hours >= monetizationGoals.hours && 
                   stats.videos >= monetizationGoals.videos && 
                   stats.followers >= monetizationGoals.followers;

  const isStreamer = user.currentRole === "streamer";

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 space-y-8 pb-24">
      <div className="bg-surface-container p-8 rounded-2xl border border-outline-variant/10">
        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary/20 bg-surface-container-highest">
              <img 
                src={formData.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            </div>
            <button className="absolute bottom-0 right-0 p-2 bg-primary text-on-primary rounded-full shadow-lg hover:scale-110 transition-transform">
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 space-y-4 text-center md:text-left">
            {isEditing ? (
              <div className="space-y-4">
                <input 
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="w-full bg-surface-container-low border-b-2 border-primary outline-none px-0 py-2 text-2xl font-headline font-extrabold tracking-tight focus:ring-0"
                  placeholder="Display Name"
                />
                <textarea 
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full bg-surface-container-low border border-outline-variant/20 rounded-lg p-3 text-sm text-on-surface-variant outline-none focus:border-primary transition-colors"
                  placeholder="Tell your viewers about yourself..."
                  rows={3}
                />
                <div className="flex gap-2">
                  <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-6 py-2 bg-primary text-on-primary rounded-lg font-bold hover:opacity-90 disabled:opacity-50 transition-all"
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </button>
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-2 bg-surface-container-highest text-on-surface rounded-lg font-bold hover:bg-surface-variant transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <h1 className="text-3xl font-headline font-extrabold tracking-tight">
                    {user.displayName || "Stremo Creator"}
                  </h1>
                  <p className="text-on-surface-variant flex items-center justify-center md:justify-start gap-2 mt-1">
                    <Mail className="w-4 h-4" /> {user.email}
                  </p>
                </div>

                <p className="text-on-surface-variant max-w-lg">
                  {user.bio || "No bio yet. Tell your viewers about yourself!"}
                </p>
              </>
            )}

            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              <div className="bg-surface-container-low px-4 py-2 rounded-xl border border-outline-variant/10">
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest block">Followers</span>
                <span className="text-xl font-bold text-primary">{stats.followers}</span>
              </div>
              <div className="bg-surface-container-low px-4 py-2 rounded-xl border border-outline-variant/10">
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest block">Streams</span>
                <span className="text-xl font-bold text-primary">{stats.videos}</span>
              </div>
            </div>
          </div>

          <button 
            onClick={() => setIsEditing(!isEditing)}
            className="px-6 py-2 bg-surface-container-highest text-on-surface rounded-lg font-bold hover:bg-surface-variant transition-colors"
          >
            Edit Profile
          </button>
        </div>
      </div>

      {/* Reward Mechanism / Monetization */}
      <div className="bg-surface-container p-8 rounded-2xl border border-outline-variant/10 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-headline font-bold flex items-center gap-2">
            <Award className="w-6 h-6 text-tertiary" />
            Monetization Roadmap
          </h2>
          {isEligible ? (
            <span className="bg-tertiary/20 text-tertiary px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Eligible
            </span>
          ) : (
            <span className="bg-surface-container-highest text-on-surface-variant px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
              <Lock className="w-3 h-3" /> Locked
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatProgress 
            label="Stream Hours" 
            current={stats.hours} 
            goal={monetizationGoals.hours} 
            icon={<Clock className="w-4 h-4" />}
          />
          <StatProgress 
            label="Total Videos" 
            current={stats.videos} 
            goal={monetizationGoals.videos} 
            icon={<PlayCircle className="w-4 h-4" />}
          />
          <StatProgress 
            label="Followers" 
            current={stats.followers} 
            goal={monetizationGoals.followers} 
            icon={<Users className="w-4 h-4" />}
          />
        </div>

        {isEligible && (
          <button className="w-full py-4 bg-kinetic-gradient text-on-primary font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.01] transition-transform">
            Enable Monetization Now
          </button>
        )}
      </div>

      {isStreamer && (
        <>
          {/* Streamer Settings */}
          <div className="bg-surface-container p-8 rounded-2xl border border-outline-variant/10 space-y-6">
            <h2 className="text-xl font-headline font-bold flex items-center gap-2 text-primary">
              <Shield className="w-6 h-6" />
              Streamer Settings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/10 space-y-2">
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Stream Key</span>
                <div className="flex items-center justify-between gap-2">
                  <code className="bg-surface-container-highest px-3 py-1 rounded font-mono text-xs flex-1 truncate">sk_live_••••••••••••••••</code>
                  <button className="text-primary text-xs font-bold hover:underline">Reset</button>
                </div>
              </div>
              <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/10 space-y-2">
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Server URL</span>
                <div className="flex items-center justify-between gap-2">
                  <code className="bg-surface-container-highest px-3 py-1 rounded font-mono text-xs flex-1 truncate">rtmp://ingest.stremo.live/app</code>
                  <button className="text-primary text-xs font-bold hover:underline">Copy</button>
                </div>
              </div>
            </div>
          </div>

          {/* Past Broadcasts (VODs) */}
          <div className="bg-surface-container p-8 rounded-2xl border border-outline-variant/10 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-headline font-bold flex items-center gap-2">
                <PlayCircle className="w-6 h-6 text-primary" />
                Past Broadcasts (VODs)
              </h2>
              <span className="text-xs font-bold text-on-surface-variant bg-surface-container-highest px-2 py-1 rounded">
                {vods.length} Videos
              </span>
            </div>

            {loadingVods ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2].map(i => (
                  <div key={i} className="h-24 bg-surface-container-highest rounded-xl animate-pulse" />
                ))}
              </div>
            ) : vods.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vods.map((vod) => (
                  <div key={vod.id} className="flex gap-4 bg-surface-container-low p-3 rounded-xl border border-outline-variant/5 group hover:border-primary/20 transition-colors relative">
                    <div 
                      onClick={() => onViewVOD(vod.id)}
                      className="w-32 aspect-video rounded-lg overflow-hidden bg-surface-container-highest flex-shrink-0 cursor-pointer"
                    >
                      <img 
                        src={vod.thumbnailURL || `https://picsum.photos/seed/${vod.id}/320/180`} 
                        alt="VOD" 
                        className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" 
                      />
                    </div>
                    <div className="flex flex-col justify-center flex-1 min-w-0">
                      <h4 
                        onClick={() => onViewVOD(vod.id)}
                        className="text-sm font-bold line-clamp-1 cursor-pointer hover:text-primary transition-colors"
                      >
                        {vod.title}
                      </h4>
                      <p className="text-[10px] text-on-surface-variant uppercase font-bold">
                        {new Date(vod.createdAt).toLocaleDateString()} • {vod.category}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <button 
                          onClick={() => deleteVOD(vod.id)}
                          className="p-1.5 rounded-md bg-error/10 text-error hover:bg-error/20 transition-colors"
                          title="Delete VOD"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          className="p-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                          title="Edit Metadata"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center bg-surface-container-low rounded-xl border border-dashed border-outline-variant/20">
                <PlayCircle className="w-12 h-12 text-on-surface-variant opacity-20 mx-auto mb-2" />
                <p className="text-sm text-on-surface-variant">No past broadcasts found.</p>
                <p className="text-[10px] text-on-surface-variant uppercase font-bold mt-1">Go live to create your first VOD!</p>
              </div>
            )}
            
            {vods.length > 0 && (
              <button className="w-full py-2 text-xs font-bold text-on-surface-variant hover:text-primary transition-colors">
                View All Broadcasts
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function StatProgress({ label, current, goal, icon }: { label: string, current: number, goal: number, icon: any }) {
  const progress = Math.min(100, (current / goal) * 100);
  return (
    <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/10 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-on-surface-variant">
          {icon}
          <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
        </div>
        <span className="text-xs font-bold">{Math.round(progress)}%</span>
      </div>
      <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary transition-all duration-1000" 
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-[10px] text-on-surface-variant font-medium">
        {current} / {goal} {label.toLowerCase()}
      </p>
    </div>
  );
}
