// app/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation"; // App Router hook
import { useAuth } from "@/app/components/AuthProvider";

export default function HomePage() {
  const router = useRouter();
  const { session } = useAuth();

  useEffect(() => {
    // Redirect to /home if there is a valid session.
    if (session) {
      router.replace("/home");
    }
  }, [session, router]);

  return (
    <div>
      <section className="landing">
        <h1 className="text-4xl font-medium">Able</h1>
        <p>Interactive learning, designed to be fun.</p>
        <div className="horizontal-list">
          <a href="/signup" className="button-primary">
            Get Started
          </a>
        </div>
      </section>
    </div>
  );
}
