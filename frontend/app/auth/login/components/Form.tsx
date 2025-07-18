"use client";
import React, { useCallback, useState } from "react";
import UidInput from "./form/UidInput";
import PasswordInput from "./form/PasswordInput";
import rotateUrl from "@/utils/URL";
import Button from "@/components/Button";
import { token } from "@/utils/Tokenize";
import { useTransitionRouter } from "next-view-transitions";
import Link from "next/link";
import { setCookie } from "@/utils/Cookies";

// ✅ Normalize and store allowed UIDs
const allowedUsernames = new Set(
  (process.env.NEXT_PUBLIC_SUPPORTED_UIDS || "")
    .split(",")
    .map((uid) => uid.trim().toLowerCase().replace("@srmist.edu.in", ""))
);

export default function Form() {
  const router = useTransitionRouter();
  const [uid, setUid] = useState("");
  const [pass, setPass] = useState("");

  const [status, setStatus] = useState<number>(0);
  const [statusMessage, setMessage] = useState("");

  const handleLogin = useCallback(async (account: string, password: string) => {
    const cleanedAccount = account
      .trim()
      .toLowerCase()
      .replace("@srmist.edu.in", "");

    // ❌ Block unauthorized users
    if (!allowedUsernames.has(cleanedAccount)) {
      setStatus(-2);
      setMessage("Access Denied: Unauthorized UID.");
      return;
    }

    setStatus(1);
    try {
      const login = await fetch(`${rotateUrl()}/login`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          account: cleanedAccount,
          password,
        }),
      });

      if (!login.ok) {
        setStatus(-1);
        setMessage("Server error or invalid credentials.");
        return;
      }

      const loginResponse = await login.json();

      if (loginResponse.authenticated) {
        if (!loginResponse.cookies) {
          setStatus(-1);
          setMessage("No cookies received. Wrong password?");
          return;
        }

        setCookie("key", loginResponse.cookies);
        setStatus(2);
        setMessage("Login successful. Redirecting...");
        router.push("/academia");
      } else {
        setStatus(-1);
        if (loginResponse.message?.includes("Digest")) {
          setMessage(
            "First-time login? Visit academia.srmist.edu.in to set your password."
          );
        } else {
          setMessage(loginResponse.message || "Authentication failed.");
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      setStatus(-1);
      setMessage("Unexpected error during login.");
    }
  }, []);

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
      }}
    >
      {status < 0 && (
        <p className="rounded-2xl bg-light-error-background px-4 py-2 text-light-error-color dark:bg-dark-error-background dark:text-dark-error-color">
          {statusMessage}
        </p>
      )}

      {status === 2 && (
        <p className="rounded-2xl bg-light-success-background px-4 py-2 text-light-success-color dark:bg-dark-success-background dark:text-dark-success-color">
          {statusMessage}
        </p>
      )}

      <div className="relative flex flex-col gap-1">
        <UidInput uid={uid} setUid={setUid} />
        <PasswordInput password={pass} setPassword={setPass} />
      </div>

      <div className="flex flex-row gap-2">
        <Button
          disabled={!uid || !pass || status === 1 || status === 2}
          className={`w-full md:w-fit ${
            status === 2
              ? "border border-light-success-color bg-light-success-background text-light-success-color dark:border-dark-success-color dark:bg-dark-success-background dark:text-dark-success-color"
              : status === 1
              ? "border border-light-warn-color bg-light-warn-background text-light-warn-color dark:border-dark-warn-color dark:bg-dark-warn-background dark:text-dark-warn-color"
              : status < 0
              ? "border border-light-error-color bg-light-error-background text-light-error-color dark:border-dark-error-color dark:bg-dark-error-background dark:text-dark-error-color"
              : ""
          }`}
          type="submit"
          onClick={() => handleLogin(uid, pass)}
        >
          {status === 1 ? "Authenticating..." : status === 2 ? "Success" : "Login"}
        </Button>
        <Link
          href="https://academia.srmist.edu.in/reset"
          className="border-2 opacity-50 text-light-color dark:text-dark-color border-light-color dark:border-dark-color px-4 py-2 rounded-full text-sm font-medium"
        >
          Forgot
        </Link>
      </div>
    </form>
  );
}
