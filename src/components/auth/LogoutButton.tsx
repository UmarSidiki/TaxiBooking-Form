"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";

type LogoutButtonProps = {
  className?: string;
  callbackUrl?: string;
};

export default function LogoutButton({
  className,
  callbackUrl,
}: LogoutButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await signOut({ callbackUrl: callbackUrl ?? "/" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleSignOut}
      className={className}
      disabled={loading}
      variant="outline"
    >
      {loading ? "Signing out..." : "Log out"}
    </Button>
  );
}
