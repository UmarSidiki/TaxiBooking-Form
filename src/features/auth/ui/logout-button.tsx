"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/shared/ui/button";

type LogoutButtonProps = {
  className?: string;
  callbackUrl?: string;
  variant?: "outline" | "ghost";
};

export default function LogoutButton({
  className,
  callbackUrl,
  variant = "outline",
}: LogoutButtonProps) {
  const t = useTranslations("Auth.Desk");
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
      variant={variant}
    >
      <LogOut
        className="hidden size-4 group-data-[collapsible=icon]:inline"
        aria-hidden="true"
      />
      <span className="group-data-[collapsible=icon]:sr-only">
        {loading ? t("signing_out") : t("log_out")}
      </span>
    </Button>
  );
}
