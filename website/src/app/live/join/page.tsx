"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function JoinLivePage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    setLoading(true);
    setError("");

    try {
      // Validate session code
      const { data: session, error: sessionError } = await supabase
        .from("live_sessions")
        .select("id, has_started, is_active")
        .eq("join_code", code)
        .single();

      if (sessionError || !session) {
        throw new Error("Invalid session code");
      }

      if (!session.is_active) {
        throw new Error("Session has ended");
      }

      if (session.has_started) {
        throw new Error("Session has already started");
      }

      // Get user info
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        router.push("/login");
        return;
      }

      // Check existing participant using maybeSingle
      const { data: existingParticipant } = await supabase
        .from("participants")
        .select("id")
        .eq("session_id", session.id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!existingParticipant) {
        // Get profile with maybeSingle
        const { data: profile } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", user.id)
          .maybeSingle();

        const username = profile?.username || user.email?.split("@")[0] || "Guest";

        // Insert participant
        const { error: insertError } = await supabase
          .from("participants")
          .insert({
            session_id: session.id,
            user_id: user.id,
            name: username,
            score: 0
          });

        if (insertError) {
          console.error("Insert error:", insertError);
          throw new Error("Failed to join session");
        }
      }

      router.push(`/live/play/${session.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
          Join Live Session
        </h1>

        <div className="space-y-6">
          <div>
            <input
              type="text"
              placeholder="Enter 6-digit code"
              className="w-full"
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              inputMode="numeric"
            />
          </div>

          <button
            onClick={handleJoin}
            className="w-full button-primary"
            disabled={loading || code.length !== 6}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Joining...
              </span>
            ) : (
              "Join Session"
            )}
          </button>

          {error && (
            <div className="bg-red-50 border border-red-200 p-3 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="text-center text-gray-600 text-sm">
            Need help?{" "}
            <Link
              href="/support"
              className="link"
            >
              Contact support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}