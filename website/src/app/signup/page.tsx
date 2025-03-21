"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const themeColors = {
  success: {
    bg: "#29cc57",
    border: "#15b441",
    text: "#ffffff"
  },
  error: {
    bg: "#fee2e2",
    border: "#ef4444",
    text: "#dc2626"
  }
};

export default function Signup() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [age, setAge] = useState("");
  const [isValidEmail, setIsValidEmail] = useState(true);
  const [emailBlurred, setEmailBlurred] = useState(false);
  const [showFields, setShowFields] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSignUpEnabled, setIsSignUpEnabled] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error', content: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const validateEmail = (emailValue: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const valid = emailRegex.test(emailValue);
    setIsValidEmail(valid);
    setShowFields(valid);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!email) newErrors.email = "Email is required.";
    if (!isValidEmail) newErrors.email = "Invalid email address.";
    if (!password || password.length < 8)
      newErrors.password = "Password must be at least 8 characters long.";
    if (!firstName) newErrors.firstName = "First name is required.";
    if (!lastName) newErrors.lastName = "Last name is required.";
    if (!age || Number(age) < 13)
      newErrors.age = "You must be at least 13 years old.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEmailSignup = async () => {
    if (!isSignUpEnabled) {
      setMessage({ type: 'error', content: "Sign-up is currently disabled." });
      return;
    }

    if (!validateForm()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            age: Number(age),
          },
        },
      });

      if (error) throw error;
      
      setMessage({
        type: 'success',
        content: "Signup successful! Please check your email for confirmation."
      });
    } catch (error: any) {
      setMessage({
        type: 'error',
        content: error.message || "An unexpected error occurred. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({ provider: "google" });
      if (error) throw error;
      setMessage({ type: 'success', content: "Redirecting to Google..." });
    } catch (error: any) {
      setMessage({ type: 'error', content: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen gap-20">
      <img src="https://placehold.co/600x400" alt="Placeholder" />

      <main className="w-full max-w-md bg-white p-6 rounded-lg overflow-y-auto">
        {/* Preserve all original button styling */}
        <div className="stack">
          {/* Google Login Button */}
          <button className="button-secondary w-full mt-3" onClick={handleGoogleSignIn}>
            <svg className="w-5 h-5" viewBox="0 0 20 21" focusable="false" aria-hidden="true">
              <path fillRule="evenodd" clipRule="evenodd" d="M20.0002 10.511C20.0002 9.81688 19.9352 9.14949 19.8146 8.50879H10.2041V12.2951H15.6958C15.4593 13.5187 14.7404 14.5554 13.6596 15.2495V17.7055H16.9575C18.887 16.0014 20.0002 13.492 20.0002 10.511Z" fill="#4285F4"></path>
              <path fillRule="evenodd" clipRule="evenodd" d="M10.2048 20.0766C12.96 20.0766 15.2698 19.2001 16.9582 17.7051L13.6603 15.2491C12.7466 15.8364 11.5778 16.1834 10.2048 16.1834C7.54708 16.1834 5.29751 14.4616 4.49508 12.1479H1.08594V14.684C2.765 17.8831 6.21589 20.0766 10.2048 20.0766Z" fill="#34A853"></path>
              <path fillRule="evenodd" clipRule="evenodd" d="M4.49451 12.1483C4.29042 11.561 4.17446 10.9336 4.17446 10.2885C4.17446 9.64332 4.29042 9.01597 4.49451 8.42867V5.89258H1.08536C0.394255 7.21401 0 8.70897 0 10.2885C0 11.868 0.394255 13.3629 1.08536 14.6844L4.49451 12.1483Z" fill="#FBBC05"></path>
              <path fillRule="evenodd" clipRule="evenodd" d="M10.2048 4.39312C11.703 4.39312 13.0481 4.88699 14.1056 5.85694L17.0324 3.04944C15.2652 1.46994 12.9553 0.5 10.2048 0.5C6.21589 0.5 2.765 2.6935 1.08594 5.89253L4.49508 8.42862C5.29751 6.115 7.54708 4.39312 10.2048 4.39312Z" fill="#EA4335"></path>
            </svg>
          </button>

          <div className="divider">OR</div>
        </div>

        {/* Preserve all original form styling */}
        <form className="stack">
          <input
            placeholder="Email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              validateEmail(e.target.value);
            }}
            onBlur={() => setEmailBlurred(true)}
            className={`outline ${
              !isValidEmail && emailBlurred
                ? "outline-gray-200 hover:outline-gray-300 focus:outline-red-400"
                : "outline-gray-200 hover:outline-gray-300 focus:outline-blue-400"
            }`}
          />
          {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}

          {showFields && (
            <>
              {/* Keep all input fields and error messages exactly as they were */}
              <input
                placeholder="Password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {errors.password && (
                <p className="text-red-500 text-sm">{errors.password}</p>
              )}

              <div className="input-group">
                <input
                  placeholder="First Name"
                  name="first_name"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
                <input
                  placeholder="Last Name"
                  name="last_name"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
              {errors.firstName && (
                <p className="text-red-500 text-sm">{errors.firstName}</p>
              )}
              {errors.lastName && (
                <p className="text-red-500 text-sm">{errors.lastName}</p>
              )}

              <input
                placeholder="Age"
                name="age"
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />
              {errors.age && (
                <p className="text-red-500 text-sm">{errors.age}</p>
              )}
            </>
          )}
        </form>
        
        {/* Preserve original button styling */}
        <button
          className="button-primary w-full mt-3"
          onClick={handleEmailSignup}
          disabled={loading}
        >
          {loading ? "Signing up..." : "Sign Up"}
        </button>

        <div className="text-center text-sm mt-5">
          Already have an account?
          <a href="/login" className="link text-sm ml-2">Login</a>
        </div>

        {/* Only modified section: Success/Error message box */}
        {message && (
          <div
            style={{
              backgroundColor: message.type === 'success' 
                ? "var(--chakra-colors-green-600)" 
                : "var(--chakra-colors-red-50)",
              color: message.type === 'success' 
                ? "#ffffff" 
                : "var(--chakra-colors-red-600)",
              fontWeight: "500",
              padding: "16px",
              borderRadius: "10px",
              marginTop: "16px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              fontSize: "0.875rem"
            }}
          >
            <svg
              width="30"
              height="30"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              {message.type === 'success' ? (
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              ) : (
                <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
              )}
            </svg>
            <span>{message.content}</span>
          </div>
        )}
      </main>
    </div>
  );
}