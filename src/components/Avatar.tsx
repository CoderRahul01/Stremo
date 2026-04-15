import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { MessageCircle, DollarSign, Star } from "lucide-react";

interface AvatarProps {
  notification?: {
    type: "donation" | "follow" | "message";
    message: string;
    userName: string;
  } | null;
}

export default function StremoAvatar({ notification }: AvatarProps) {
  const [position, setPosition] = useState({ x: 20, y: 80 });
  const [isWalking, setIsWalking] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!notification) {
        setIsWalking(true);
        setPosition((prev) => ({
          x: Math.max(10, Math.min(90, prev.x + (Math.random() - 0.5) * 10)),
          y: Math.max(70, Math.min(90, prev.y + (Math.random() - 0.5) * 5)),
        }));
        setTimeout(() => setIsWalking(false), 1000);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [notification]);

  return (
    <div className="fixed bottom-24 right-8 z-50 pointer-events-none">
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute bottom-20 right-0 bg-primary text-on-primary p-3 rounded-xl shadow-2xl min-w-[200px] border border-white/20"
          >
            <div className="flex items-center gap-2 mb-1">
              {notification.type === "donation" && <DollarSign className="w-4 h-4" />}
              {notification.type === "follow" && <Star className="w-4 h-4" />}
              {notification.type === "message" && <MessageCircle className="w-4 h-4" />}
              <span className="font-bold text-xs uppercase tracking-wider">
                {notification.userName}
              </span>
            </div>
            <p className="text-sm font-medium">{notification.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        animate={{
          x: position.x,
          y: position.y,
          rotate: isWalking ? [0, -5, 5, 0] : 0,
        }}
        transition={{ duration: 1 }}
        className="relative w-16 h-16"
      >
        {/* Cute Stremo Guy SVG */}
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
          <circle cx="50" cy="50" r="40" fill="#b89fff" />
          <circle cx="35" cy="40" r="5" fill="white" />
          <circle cx="65" cy="40" r="5" fill="white" />
          <path
            d="M 30 70 Q 50 85 70 70"
            stroke="white"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
          <motion.path
            animate={{ scaleY: isWalking ? [1, 1.2, 1] : 1 }}
            d="M 40 90 L 40 100 M 60 90 L 60 100"
            stroke="#b89fff"
            strokeWidth="8"
            strokeLinecap="round"
          />
        </svg>
      </motion.div>
    </div>
  );
}
