import { Link } from "@tanstack/react-router";
import { Wallet, Cpu, Wifi, LogOut, ShieldAlert } from "lucide-react";
import { useNexus, shorten } from "@/lib/nexus-store";

export function Navbar() {
  const { walletAddress, network, connectWallet, disconnectWallet } = useNexus();
  return (
    <header className="sticky top-0 z-40 nav-blur">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="grid size-11 place-items-center rounded-2xl grad-cyber glow text-white transition-transform group-hover:scale-105">
            <Cpu className="size-6" />
          </div>
          <div className="leading-tight">
            <div className="text-xl font-extrabold tracking-tight text-grad-cyber text-display">NEXUS</div>
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Semiconductor Ledger
            </div>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-2 rounded-full border border-success/30 bg-success/10 px-3 py-1.5 font-semibold text-success-foreground">
            <Wifi className="size-4 text-success" />
            <span className="font-mono">{network}</span>
            <span className="size-1.5 rounded-full bg-success animate-pulse-dot" />
          </span>
          <span className="rounded-full border border-border bg-card/70 px-3 py-1.5 font-mono text-muted-foreground">
            chainId 0xaa36a7
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/security"
            activeProps={{ className: "grad-cyber text-white glow border-transparent" }}
            inactiveProps={{ className: "border-border bg-white/70 text-foreground hover:bg-white hover:border-primary/40" }}
            className="inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition-all hover:-translate-y-px"
          >
            <ShieldAlert className="size-4" />
            <span className="hidden sm:inline">Security</span>
          </Link>
          {walletAddress ? (
            <>
              <div className="hidden sm:flex flex-col items-end leading-tight">
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Wallet</span>
                <span className="font-mono text-sm font-medium">{shorten(walletAddress)}</span>
              </div>
              <button
                onClick={disconnectWallet}
                className="grid size-11 place-items-center rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:border-destructive/40 hover:bg-destructive/5 transition-all"
                aria-label="Disconnect"
              >
                <LogOut className="size-[18px]" />
              </button>
            </>
          ) : (
            <button
              onClick={connectWallet}
              className="btn-premium inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm"
            >
              <Wallet className="size-[18px]" />
              Connect MetaMask
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
