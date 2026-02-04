"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/app/hooks/useAuth";
import { MdEmail, MdLock, MdPerson } from "react-icons/md";
import Image from "next/image";

interface SignInModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSignInSuccess?: () => void;
}

export function SignInModal({ open, onOpenChange, onSignInSuccess }: SignInModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isTeslaLoading, setIsTeslaLoading] = useState(false);
  const { signInWithEmail, signUpWithEmail, signInWithTesla } = useAuth();

  const handleEmailSignIn = async () => {
    setError("");
    setIsEmailLoading(true);
    try {
      const { error } = isSignUp
        ? await signUpWithEmail(email, password, displayName)
        : await signInWithEmail(email, password);

      if (error) {
        setError(error.message);
      } else {
        onSignInSuccess?.();
        onOpenChange(false);
        setEmail("");
        setPassword("");
        setDisplayName("");
        setError("");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleTeslaSignIn = async () => {
    setError("");
    setIsTeslaLoading(true);
    try {
      const { error } = await signInWithTesla();
      if (error) {
        setError(typeof error === 'string' ? error : (error as any)?.message || "Failed to sign in with Tesla");
        setIsTeslaLoading(false);
      }
      // If successful, user will be redirected to callback
    } catch (err: any) {
      setError(err?.message || "An error occurred");
      setIsTeslaLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1e1e1e] text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white text-4xl font-semibold">
            {isSignUp ? "Create Account" : "Sign In"}
          </DialogTitle>
        </DialogHeader>
        <DialogDescription className="text-white/60 text-base">
            {isSignUp && "Create an account to sync your settings to the cloud"}
          </DialogDescription>

        <div className="space-y-4">
          {isSignUp && (
            <div>
              <label htmlFor="displayName" className="text-white/80 text-base font-medium mb-2 block">
                Display name (First and Last name)
              </label>
              <div className="relative">
                <MdPerson className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <Input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your first and last name"
                  className="w-full pl-10 bg-white/5 text-white placeholder-white/40 focus:ring-0 focus:outline-none h-14 text-base"
                  autoFocus={false}
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="email" className="text-white/80 text-base font-medium mb-2 block">
              Email
            </label>
            <div className="relative">
              <MdEmail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full pl-10 bg-white/5 text-white placeholder-white/40 focus:ring-0 focus:outline-none h-14 text-base"
                autoFocus={false}
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="text-white/80 text-base font-medium mb-2 block">
              Password
            </label>
            <div className="relative">
              <MdLock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-10 bg-white/5 text-white placeholder-white/40 focus:ring-0 focus:outline-none h-14 text-base"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isEmailLoading && !isTeslaLoading) {
                    handleEmailSignIn();
                  }
                }}
              />
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm mt-2">{error}</p>
          )}

          <Button
            onClick={handleEmailSignIn}
            disabled={isEmailLoading || isTeslaLoading || !email || !password || (isSignUp && !displayName.trim())}
            className={cn(
              "w-full bg-white text-black hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed",
              "h-14 text-lg font-medium flex items-center justify-center gap-2"
            )}
          >
            {isEmailLoading ? (
              <>
                <div className="relative w-5 h-5">
                  <div className="absolute inset-0 border-2 border-black/20 rounded-full"></div>
                  <div className="absolute inset-0 border-2 border-transparent border-t-black rounded-full animate-spin"></div>
                </div>
              </>
            ) : (
              isSignUp ? "Sign Up" : "Sign In"
            )}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#1e1e1e] text-white/60">Or</span>
            </div>
          </div>

          <Button
            onClick={handleTeslaSignIn}
            disabled={isEmailLoading || isTeslaLoading}
            className={cn(
              "w-full bg-white/10 text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed",
              "h-14 text-lg font-medium flex items-center justify-center gap-2"
            )}
          >
            {isTeslaLoading ? (
              <>
                <div className="relative w-5 h-5">
                  <div className="absolute inset-0 border-2 border-white/20 rounded-full"></div>
                  <div className="absolute inset-0 border-2 border-transparent border-t-white rounded-full animate-spin"></div>
                </div>
              </>
            ) : (
              <>
                <Image
                  src="/tesla.svg"
                  alt="Tesla"
                  width={24}
                  height={24}
                  className="w-8 h-8 translate-y-[0.09rem]"
                  style={{ filter: 'brightness(0) invert(1)' }}
                />
                Sign {isSignUp ? "up" : "in"} with Tesla
              </>
            )}
          </Button>

            <Button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
                setDisplayName("");
                }}
              className="w-full bg-white/10 text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-medium flex items-center justify-center gap-2"
            >
              {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

