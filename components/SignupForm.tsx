"use client";

import { useState } from "react";

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

type PlanOption = "basic" | "premium";

export default function SignupForm() {
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState<PlanOption>("basic");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, plan }),
      });

      if (!response.ok) {
        throw new Error("Signup failed");
      }

      if (typeof window !== "undefined" && window.dataLayer) {
        window.dataLayer.push({
          event: "signup_success",
          user_email: email,
          plan,
        });

        if (process.env.NODE_ENV !== "production") {
          console.info("signup_success pushed to dataLayer", { email, plan });
        }
      }

      alert("Signup successful!");
    } catch (error) {
      console.error("Signup failed:", error);
      alert("Signup failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <fieldset disabled={isSubmitting} style={{ border: "none", padding: 0 }}>
        <label style={{ display: "block", marginBottom: 8 }}>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
            style={{ display: "block", width: "100%", marginTop: 4 }}
          />
        </label>

        <label style={{ display: "block", marginBottom: 16 }}>
          Plan
          <select
            value={plan}
            onChange={(event) => setPlan(event.target.value as PlanOption)}
            style={{ display: "block", width: "100%", marginTop: 4 }}
          >
            <option value="basic">Basic</option>
            <option value="premium">Premium</option>
          </select>
        </label>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Signing up..." : "Sign Up"}
        </button>
      </fieldset>
    </form>
  );
}

