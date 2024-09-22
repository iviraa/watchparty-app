"use client";

import { Button } from "@/components/ui/button";
import { signIn, signOut, useSession } from "next-auth/react";
import { PlayCircle } from "lucide-react";
import Link from "next/link";

export function Appbar() {
  const session = useSession();

  return (
    <div className="flex justify-between pt-2">
      <Link className="flex items-center justify-center " href="#">
        <PlayCircle className="h-6 w-6 text-primary" />
        <span className="ml-2 text-xl font-bold">Loope</span>
      </Link>
      <div>
        {session.data?.user && (
          <Button className="text-sm font-medium" onClick={() => signOut()}>
            LogOut
          </Button>
        )}

        {!session.data?.user && (
          <Button className="text-sm font-semibold " onClick={() => signIn()}>
            SignIn
          </Button>
        )}
      </div>
    </div>
  );
}
