import { ModeToggle } from "@/components/modules/dark-mode-toggle";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col gap-10 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <div className="flex items-center gap-4">
        <ModeToggle />
        <h1 className="text-4xl font-bold">Finance Tracker</h1>
      </div>
      <p className="text-lg text-zinc-600 dark:text-zinc-400">
        Track your expenses and income
      </p>
    </div>
  );
}
