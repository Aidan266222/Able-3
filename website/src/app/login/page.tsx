// app/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithOAuth({ provider: "google" });
    if (error) {
      setMessage(error.message);
    }
    setLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
    } else {
      // On successful login, just redirect without showing a success message.
      setTimeout(() => {
        router.push("/home");
      }, 1000);
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen gap-20">
      <img src="https://placehold.co/600x400" alt="Placeholder" />

      <main className="w-full max-w-md bg-white p-6 rounded-lg overflow-y-auto">
        <form onSubmit={handleLogin} className="stack">
          {/* Google Login Button */}
          <button
            className="button-secondary w-full mt-3"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <svg className="w-5 h-5" viewBox="0 0 20 21" focusable="false" aria-hidden="true">
              <path fillRule="evenodd" clipRule="evenodd" d="M20.0002 10.511C20.0002 9.81688 19.9352 9.14949 19.8146 8.50879H10.2041V12.2951H15.6958C15.4593 13.5187 14.7404 14.5554 13.6596 15.2495V17.7055H16.9575C18.887 16.0014 20.0002 13.492 20.0002 10.511Z" fill="#4285F4"></path>
              <path fillRule="evenodd" clipRule="evenodd" d="M10.2048 20.0766C12.96 20.0766 15.2698 19.2001 16.9582 17.7051L13.6603 15.2491C12.7466 15.8364 11.5778 16.1834 10.2048 16.1834C7.54708 16.1834 5.29751 14.4616 4.49508 12.1479H1.08594V14.684C2.765 17.8831 6.21589 20.0766 10.2048 20.0766Z" fill="#34A853"></path>
              <path fillRule="evenodd" clipRule="evenodd" d="M4.49451 12.1483C4.29042 11.561 4.17446 10.9336 4.17446 10.2885C4.17446 9.64332 4.29042 9.01597 4.49451 8.42867V5.89258H1.08536C0.394255 7.21401 0 8.70897 0 10.2885C0 11.868 0.394255 13.3629 1.08536 14.6844L4.49451 12.1483Z" fill="#FBBC05"></path>
              <path fillRule="evenodd" clipRule="evenodd" d="M10.2048 4.39312C11.703 4.39312 13.0481 4.88699 14.1056 5.85694L17.0324 3.04944C15.2652 1.46994 12.9553 0.5 10.2048 0.5C6.21589 0.5 2.765 2.6935 1.08594 5.89253L4.49408 8.42862C5.29751 6.115 7.54708 4.39312 10.2048 4.39312Z" fill="#EA4335"></path>
            </svg>
          </button>
          <div className="divider">OR</div>
          <input
            placeholder="Email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="outline outline-gray-200 hover:outline-gray-300 focus:outline-blue-400"
            required
          />
          <input
            placeholder="Password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="outline outline-gray-200 hover:outline-gray-300 focus:outline-blue-400"
            required
          />
          {message && <p className="font-medium text-sm text-red-500">{message}</p>}
          <button
            type="submit"
            className="button-primary w-full mt-3"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Log In"}
          </button>
          <div className="flex text-sm mt-2">
            Don't have an account?
            <a href="/signup" className="link text-sm ml-2">Sign Up</a>
          </div>
          <div className="flex text-sm">
            <p className="link text-sm">Forgot your password?</p>
          </div>
        </form>
      </main>
    </div>
  );
}
