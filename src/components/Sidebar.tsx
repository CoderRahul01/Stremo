import { 
  Home, 
  TrendingUp, 
  Video, 
  Library, 
  Folder,
  Settings,
  HelpCircle,
  MessageSquare,
  Users
} from "lucide-react";
import { cn } from "../lib/utils";

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  currentRole: "user" | "streamer";
}

export default function Sidebar({ activePage, onNavigate, currentRole }: SidebarProps) {
  const isStreamer = currentRole === "streamer";

  const menuItems = [
    { id: "dashboard", label: isStreamer ? "Dashboard" : "Home", icon: Home },
    { id: "trending", label: "Trending", icon: TrendingUp, hidden: isStreamer },
    { id: "shorts", label: "Shorts", icon: Video, hidden: isStreamer },
    { id: "subscriptions", label: "Subscriptions", icon: Users },
    { id: "library", label: "Library", icon: Folder },
  ];

  const recommended = [
    { name: "CodeWithAnna", category: "Software Dev", seed: "anna" },
    { name: "PixelPerfect", category: "UI Design", seed: "pixel" },
  ];

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-64px)] w-64 bg-surface-container-lowest flex flex-col py-4 font-sans text-sm hidden md:flex z-40 border-r border-outline-variant/5">
      <div className="flex flex-col gap-1 px-2">
        {menuItems.filter(item => !item.hidden).map((item) => (
          <div 
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={cn(
              "flex items-center gap-4 py-3 px-6 cursor-pointer transition-all rounded-lg mx-2",
              activePage === item.id 
                ? "bg-surface-container text-primary font-bold" 
                : "text-on-surface-variant hover:bg-surface-container-high hover:text-white"
            )}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </div>
        ))}
      </div>

      <div className="mt-8 px-6">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-outline mb-4">Recommended</h3>
        <div className="flex flex-col gap-4">
          {recommended.map((creator) => (
            <div 
              key={creator.name}
              onClick={() => onNavigate("stream")}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <img 
                alt={creator.name} 
                className="w-8 h-8 rounded-full border border-transparent group-hover:border-primary transition-all" 
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${creator.seed}`} 
              />
              <div>
                <p className="text-on-surface font-medium group-hover:text-primary transition-colors">{creator.name}</p>
                <p className="text-[10px] text-primary-dim">{creator.category}</p>
              </div>
            </div>
          ))}
        </div>
        <button className="text-primary-dim text-xs mt-4 font-bold hover:underline">Show More</button>
      </div>

      <div className="mt-auto flex flex-col gap-1 px-2 border-t border-surface-container pt-4">
        <div className="flex items-center gap-4 text-on-surface-variant py-3 px-6 hover:bg-surface-container-high transition-all cursor-pointer rounded-lg mx-2">
          <Settings className="w-5 h-5" /> Settings
        </div>
        <div className="flex items-center gap-4 text-on-surface-variant py-3 px-6 hover:bg-surface-container-high transition-all cursor-pointer rounded-lg mx-2">
          <HelpCircle className="w-5 h-5" /> Help
        </div>
        <div className="flex items-center gap-4 text-on-surface-variant py-3 px-6 hover:bg-surface-container-high transition-all cursor-pointer rounded-lg mx-2">
          <MessageSquare className="w-5 h-5" /> Feedback
        </div>
      </div>
    </aside>
  );
}
