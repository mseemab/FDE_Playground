import { Button } from "@factory/ui/components/button";
import Link from "next/link";
import { SignInButton } from "@/components/sign-in-button";
import { WaitlistForm } from "@/components/waitlist-form";
import { currentUser } from "@/server/supabase";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ auth_error?: string }>;
}) {
  const [user, { auth_error: authError }] = await Promise.all([currentUser(), searchParams]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-8 px-6 py-16">
      <div className="flex flex-col gap-3">
        <h1 className="text-4xl font-semibold tracking-tight">Pantry Pal</h1>
        <p className="text-muted-foreground text-lg">
          Log your groceries in seconds and see what&apos;s about to expire, so you cook it instead
          of throwing it out.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {user ? (
          <Button asChild size="lg" className="self-start">
            <Link href="/pantry">Open your pantry</Link>
          </Button>
        ) : (
          <div className="self-start">
            <SignInButton />
          </div>
        )}
        {authError && (
          <p role="alert" className="text-destructive text-sm">
            Sign-in didn&apos;t complete. Please try again.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-muted-foreground text-sm">Not ready yet? Get launch updates:</p>
        <WaitlistForm />
      </div>

      <footer className="text-muted-foreground flex gap-4 text-sm">
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
      </footer>
    </main>
  );
}
