"use client";

import { UserProfile } from "@clerk/nextjs";

export function ClerkProfile() {
  return (
    <div className="overflow-hidden rounded-[1.5rem] border bg-card shadow-panel">
      <UserProfile
        appearance={{
          elements: {
            rootBox: "w-full",
            card: "w-full shadow-none border-0 rounded-none",
            navbar: "hidden"
          }
        }}
      />
    </div>
  );
}

