/**
 * UnProtected Layout Component
 * Layout for public pages that don't require authentication
 */

import React from "react";
import { Outlet, Link } from "@tanstack/react-router";
import { Github, Twitter, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface UnProtectedLayoutProps {
  children?: React.ReactNode;
}

/**
 * UnProtected Layout Component
 */
export const UnProtectedLayout: React.FC<UnProtectedLayoutProps> = ({
  children,
}) => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {children || <Outlet />}
    </div>
  );
};
