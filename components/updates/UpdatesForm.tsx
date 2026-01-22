"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";

export function UpdatesForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/updates/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to subscribe");
      }

      setStatus("success");
      setMessage("Thanks! You're on the list.");
      setEmail("");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 mb-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          disabled={status === "loading" || status === "success"}
          className="flex-1 px-6 py-4 bg-white text-black text-lg rounded focus:outline-none focus:ring-2 focus:ring-white disabled:opacity-50"
        />
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={status === "loading" || status === "success"}
          className="whitespace-nowrap"
        >
          {status === "loading" ? "Joining..." : status === "success" ? "Joined!" : "Join the List"}
        </Button>
      </form>

      {message && (
        <Text
          className={status === "success" ? "text-green-400" : "text-red-400"}
        >
          {message}
        </Text>
      )}
    </div>
  );
}
