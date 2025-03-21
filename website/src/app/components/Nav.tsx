// app/components/Nav.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "./AuthProvider";
import { Menu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Profile {
  avatar_url?: string;
}

export default function Nav() {
  const { session, setSession } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchProfile() {
      if (!session) return;
      const { data, error } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", session.user.id)
        .single();
      if (!error) {
        setProfile(data);
      }
    }
    fetchProfile();
  }, [session]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuOpen &&
        popoverRef.current &&
        menuButtonRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        !menuButtonRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const getColorForLetter = (letter: string) => {
    const colors = [
      "#FFB6C1",
      "#FFD700",
      "#ADFF2F",
      "#87CEEB",
      "#FF7F50",
      "#9370DB",
    ];
    const index = letter.toUpperCase().charCodeAt(0) % colors.length;
    return colors[index];
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setSession(null);
    }
  };

  return (
    <header className="flex items-center justify-between p-4">
      <h1>
        <Link href="/home" className="font-medium text-3xl">
          Able
        </Link>
      </h1>
      <div className="header-buttons flex items-center space-x-2">
        {session ? (
          <>
            <button
              className="button-secondary"
              onClick={() => router.push("/my-lessons")}
            >
              <span>My Lessons</span>
            </button>
            <button
              className="button-primary"
              onClick={() => router.push("/live/join")}
            >
              <span>Join a Lesson</span>
            </button>
            <div className="relative inline-block">
              <button
                ref={menuButtonRef}
                className="button-ghost"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                <Menu color="#a8a8a8" />
              </button>
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    ref={popoverRef}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{
                      duration: 0.125,
                      ease: "easeOut",
                    }}
                    className="absolute right-0 mt-2 w-auto bg-white shadow-lg border rounded-xl z-10 origin-top-right"
                  >
                    <div className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12">
                          {profile?.avatar_url ? (
                            <img
                              src={profile.avatar_url}
                              alt="User Avatar"
                              className="w-12 h-12 rounded-full"
                            />
                          ) : (
                            <div
                              className="w-12 h-12 rounded-full flex items-center justify-center text-xl text-white font-bold"
                              style={{
                                backgroundColor: getColorForLetter(
                                  session.user.email.charAt(0)
                                ),
                              }}
                            >
                              {session.user.email.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex space-x-1">
                            <div className="flex space-x-1">
                              <p className="font-semibold">
                                {session.user.user_metadata?.first_name}
                              </p>
                              <p className="font-semibold">
                                {session.user.user_metadata?.last_name}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">
                            {session.user.email}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="border-t"></div>
                    <button
                      className="button-ghost !pl-5 text-left !rounded-none w-full py-2"
                    >
                      Account
                    </button>
                    <div className="border-t"></div>
                    <button
                      onClick={handleSignOut}
                      className="button-ghost !pl-5 text-left !rounded-t-none w-full py-2"
                    >
                      Log out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        ) : (
          <div className="nav-unauthenticated flex items-center space-x-2">
            <Link href="/login" className="button-secondary">
              Log In
            </Link>
            <Link href="/signup" className="button-primary">
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
