import { 
  Menu, 
  Search, 
  Bell, 
  Settings, 
  User as UserIcon,
  LogOut,
  ChevronDown
} from "lucide-react";
import { auth } from "../lib/firebase";
import { signOut } from "firebase/auth";

interface HeaderProps {
  user: any;
  onNavigate: (page: string) => void;
  onRoleSwitch: (role: "user" | "streamer") => void;
}

export default function Header({ user, onNavigate, onRoleSwitch }: HeaderProps) {
  const isStreamer = user.currentRole === "streamer";

  return (
    <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl flex justify-between items-center px-6 h-16 border-b border-outline-variant/10">
      <div className="flex items-center gap-4">
        <Menu className="w-6 h-6 text-primary cursor-pointer active:scale-95 transition-transform" />
        <h1 
          onClick={() => onNavigate("dashboard")}
          className="text-2xl font-black italic tracking-tighter text-primary font-headline cursor-pointer"
        >
          Stremo
        </h1>
      </div>

      <div className="hidden md:flex flex-1 max-w-xl px-12">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
          <input 
            className="w-full bg-surface-container-low border-none focus:ring-1 focus:ring-primary rounded-lg py-2 pl-10 pr-4 text-sm" 
            placeholder="Search creators, games, streams..." 
            type="text"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {isStreamer && (
          <button 
            onClick={() => onNavigate("dashboard")}
            className="hidden md:block bg-primary text-on-primary px-4 py-1.5 font-bold rounded-lg text-sm hover:opacity-90 active:scale-95 transition-transform"
          >
            Go Live
          </button>
        )}
        
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-on-surface-variant cursor-pointer hover:text-white" />
          <Settings className="w-5 h-5 text-on-surface-variant cursor-pointer hover:text-white" />
        </div>

        <div className="group relative">
          <div className="flex items-center gap-2 cursor-pointer p-1 rounded-lg hover:bg-surface-container transition-colors">
            <img 
              alt="Profile" 
              className="w-8 h-8 rounded-full border border-outline-variant" 
              src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
            />
            <ChevronDown className="w-4 h-4 text-on-surface-variant" />
          </div>
          
          <div className="absolute right-0 top-full mt-2 w-56 bg-surface-container border border-outline-variant/10 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
            <div className="p-2 space-y-1">
              <div className="px-3 py-2 border-b border-outline-variant/10 mb-1">
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Current Role</p>
                <p className="text-sm font-black text-primary capitalize">{user.currentRole || "User"}</p>
              </div>
              
              <button 
                onClick={() => onRoleSwitch(isStreamer ? "user" : "streamer")}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium hover:bg-primary/10 hover:text-primary rounded-lg transition-colors"
              >
                {isStreamer ? "Switch to Viewer Mode" : "Switch to Streamer Mode"}
              </button>

              <button 
                onClick={() => onNavigate("profile")}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium hover:bg-surface-container-highest rounded-lg transition-colors"
              >
                <UserIcon className="w-4 h-4" /> Profile
              </button>
              <button 
                onClick={() => signOut(auth)}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-error hover:bg-error/10 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
