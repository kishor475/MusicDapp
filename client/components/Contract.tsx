"use client";

import { useState, useCallback, useEffect } from "react";
import {
  uploadSong,
  purchaseSong,
  getSong,
  getTotalSongs,
  CONTRACT_ADDRESS,
} from "@/hooks/contract";
import { AnimatedCard } from "@/components/ui/animated-card";
import { Spotlight } from "@/components/ui/spotlight";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ── Icons ────────────────────────────────────────────────────

function SpinnerIcon() {
  return (
    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function MusicIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
    </svg>
  );
}

// ── Styled Input ─────────────────────────────────────────────

function Input({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-2">
      <label className="block text-[11px] font-medium uppercase tracking-wider text-white/30">
        {label}
      </label>
      <div className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-px transition-all focus-within:border-[#7c6cf0]/30 focus-within:shadow-[0_0_20px_rgba(124,108,240,0.08)]">
        <input
          {...props}
          className="w-full rounded-[11px] bg-transparent px-4 py-3 font-mono text-sm text-white/90 placeholder:text-white/15 outline-none"
        />
      </div>
    </div>
  );
}

// ── Method Signature ─────────────────────────────────────────

function MethodSignature({
  name,
  params,
  returns,
  color,
}: {
  name: string;
  params: string;
  returns?: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3 font-mono text-sm">
      <span style={{ color }} className="font-semibold">fn</span>
      <span className="text-white/70">{name}</span>
      <span className="text-white/20 text-xs">{params}</span>
      {returns && (
        <span className="ml-auto text-white/15 text-[10px]">{returns}</span>
      )}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────

type Tab = "explore" | "upload";

interface ContractUIProps {
  walletAddress: string | null;
  onConnect: () => void;
  isConnecting: boolean;
}

export default function ContractUI({ walletAddress, onConnect, isConnecting }: ContractUIProps) {
  const [activeTab, setActiveTab] = useState<Tab>("explore");
  const [error, setError] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<string | null>(null);

  const [totalSongs, setTotalSongs] = useState<string>("?");

  // Upload state
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [price, setPrice] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Explore state
  const [trackId, setTrackId] = useState("");
  const [isQuerying, setIsQuerying] = useState(false);
  const [songData, setSongData] = useState<Record<string, any> | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const truncate = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  // Fetch total songs occasionally
  useEffect(() => {
    async function init() {
      try {
        const total = await getTotalSongs();
        if (total !== null && total !== undefined) {
          setTotalSongs(total.toString());
        }
      } catch (e) {
        // ignore
      }
    }
    init();
  }, [txStatus]); 

  const handleUploadSong = useCallback(async () => {
    if (!walletAddress) return setError("Connect wallet first");
    if (!title.trim() || !artist.trim() || !price.trim()) return setError("Fill in all fields");
    if (isNaN(Number(price))) return setError("Price must be a number");
    
    setError(null);
    setIsUploading(true);
    setTxStatus("Awaiting signature...");
    
    try {
      await uploadSong(
        walletAddress,
        title.trim(),
        artist.trim(),
        BigInt(price.trim()),
        walletAddress
      );
      setTxStatus("Song uploaded on-chain!");
      setTitle("");
      setArtist("");
      setPrice("");
      setTimeout(() => setTxStatus(null), 5000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transaction failed");
      setTxStatus(null);
    } finally {
      setIsUploading(false);
    }
  }, [walletAddress, title, artist, price]);

  const handleGetSong = useCallback(async () => {
    if (!trackId.trim()) return setError("Enter a Song ID");
    if (isNaN(Number(trackId))) return setError("Song ID must be a number");
    
    setError(null);
    setIsQuerying(true);
    setSongData(null);
    
    try {
      const result = await getSong(BigInt(trackId.trim()), walletAddress || undefined);
      if (result) {
        // Handle array mapping or object mapping
        if (Array.isArray(result) && result.length >= 5) {
          setSongData({
            id: String(result[0]),
            title: String(result[1]),
            artist: String(result[2]),
            price: String(result[3]),
            owner: String(result[4])
          });
        } else if (typeof result === "object") {
          const mapped: Record<string, string> = {};
          for (const [k, v] of Object.entries(result)) {
            mapped[String(k)] = String(v);
          }
          setSongData(mapped);
        } else {
           setError("Invalid song format received.");
        }
      } else {
        setError("Song not found");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Query failed");
    } finally {
      setIsQuerying(false);
    }
  }, [trackId, walletAddress]);

  const handlePurchase = useCallback(async () => {
    if (!walletAddress) return setError("Connect wallet to purchase");
    if (!songData?.id) return setError("No song selected to purchase");
    
    setError(null);
    setIsPurchasing(true);
    setTxStatus("Awaiting signature...");
    
    try {
      await purchaseSong(walletAddress, BigInt(songData.id), walletAddress);
      setTxStatus("Purchase successful! You now own this song.");
      setTimeout(() => setTxStatus(null), 5000);
      handleGetSong(); // refresh
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transaction failed");
      setTxStatus(null);
    } finally {
      setIsPurchasing(false);
    }
  }, [walletAddress, songData, handleGetSong]);

  const tabs: { key: Tab; label: string; icon: React.ReactNode; color: string }[] = [
    { key: "explore", label: "Explore", icon: <SearchIcon />, color: "#4fc3f7" },
    { key: "upload", label: "Upload Track", icon: <MusicIcon />, color: "#7c6cf0" },
  ];

  return (
    <div className="w-full max-w-2xl animate-fade-in-up-delayed">
      {/* Toasts */}
      {error && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-[#f87171]/15 bg-[#f87171]/[0.05] px-4 py-3 backdrop-blur-sm animate-slide-down">
          <span className="mt-0.5 text-[#f87171]"><AlertIcon /></span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[#f87171]/90">Error</p>
            <p className="text-xs text-[#f87171]/50 mt-0.5 break-all">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="shrink-0 text-[#f87171]/30 hover:text-[#f87171]/70 text-lg leading-none">&times;</button>
        </div>
      )}

      {txStatus && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-[#34d399]/15 bg-[#34d399]/[0.05] px-4 py-3 backdrop-blur-sm shadow-[0_0_30px_rgba(52,211,153,0.05)] animate-slide-down">
          <span className="text-[#34d399]">
            {txStatus.includes("on-chain") || txStatus.includes("successful") ? <CheckIcon /> : <SpinnerIcon />}
          </span>
          <span className="text-sm text-[#34d399]/90">{txStatus}</span>
        </div>
      )}

      {/* Main Card */}
      <Spotlight className="rounded-2xl">
        <AnimatedCard className="p-0" containerClassName="rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#7c6cf0]/20 to-[#4fc3f7]/20 border border-white/[0.06]">
                <MusicIcon />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white/90">Music Space</h3>
                <p className="text-[10px] text-white/25 font-mono mt-0.5">{truncate(CONTRACT_ADDRESS)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
               <Badge variant="info" className="text-[10px] bg-white/[0.05]">{totalSongs} Songs</Badge>
               <Badge variant="info" className="text-[10px]">Soroban</Badge>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/[0.06] px-2">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => { setActiveTab(t.key); setError(null); setSongData(null); }}
                className={cn(
                  "relative flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-all",
                  activeTab === t.key ? "text-white/90" : "text-white/35 hover:text-white/55"
                )}
              >
                <span style={activeTab === t.key ? { color: t.color } : undefined}>{t.icon}</span>
                {t.label}
                {activeTab === t.key && (
                  <span
                    className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full transition-all"
                    style={{ background: `linear-gradient(to right, ${t.color}, ${t.color}66)` }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            
            {/* Explore Tab */}
            {activeTab === "explore" && (
              <div className="space-y-5">
                <MethodSignature name="get_song" params="(id: u64)" returns="-> Song" color="#4fc3f7" />
                <div className="flex gap-2 items-end">
                    <div className="flex-1">
                        <Input label="Song ID" value={trackId} onChange={(e) => setTrackId(e.target.value)} placeholder="e.g. 1" />
                    </div>
                </div>
                <ShimmerButton onClick={handleGetSong} disabled={isQuerying} shimmerColor="#4fc3f7" className="w-full">
                  {isQuerying ? <><SpinnerIcon /> Searching...</> : <><SearchIcon /> Search Directory</>}
                </ShimmerButton>

                {songData && (
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden animate-fade-in-up">
                    <div className="border-b border-white/[0.06] px-4 py-3 flex items-center justify-between">
                      <span className="text-[10px] font-medium uppercase tracking-wider text-white/25">Song Details</span>
                      <Badge variant={songData.id !== "0" ? "success" : "warning"}>
                         {songData.id !== "0" ? "Found" : "Missing / Not Found"}
                      </Badge>
                    </div>
                    <div className="p-4 space-y-3">
                      {Object.entries(songData).map(([key, val]) => (
                        <div key={key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 overflow-hidden">
                          <span className="text-xs text-white/35 capitalize whitespace-nowrap">{key}</span>
                          <span className="font-mono text-sm text-white/80 truncate" title={String(val)}>{String(val)}</span>
                        </div>
                      ))}
                    </div>
                    
                    {/* Purchase Action Footer */}
                    {songData.id !== "0" && (
                        <div className="border-t border-white/[0.06] p-4 bg-black/20">
                           {walletAddress ? (
                               <ShimmerButton onClick={handlePurchase} disabled={isPurchasing} shimmerColor="#34d399" className="w-full h-10 py-0 text-xs">
                                 {isPurchasing ? <><SpinnerIcon /> Purchasing...</> : <><WalletIcon /> Purchase / Transfer Ownership (Price: {songData.price})</>}
                               </ShimmerButton>
                           ) : (
                               <button onClick={onConnect} disabled={isConnecting} className="w-full rounded-xl border border-dashed border-white/20 bg-white/[0.03] py-2 text-xs text-white/60 hover:border-white/30 hover:text-white/80 transition-all">
                                 Connect wallet to purchase
                               </button>
                           )}
                        </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Upload Tab */}
            {activeTab === "upload" && (
              <div className="space-y-5">
                <MethodSignature name="upload_song" params="(title: String, artist: String, price: u64, owner: String)" color="#7c6cf0" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="Song Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Bohemian Rhapsody" />
                    <Input label="Artist" value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="e.g. Queen" />
                </div>
                <Input label="Price (unit testnet amount)" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. 100" />
                
                {walletAddress ? (
                  <ShimmerButton onClick={handleUploadSong} disabled={isUploading} shimmerColor="#7c6cf0" className="w-full">
                    {isUploading ? <><SpinnerIcon /> Uploading...</> : <><MusicIcon /> Upload to blockchain</>}
                  </ShimmerButton>
                ) : (
                  <button
                    onClick={onConnect}
                    disabled={isConnecting}
                    className="w-full rounded-xl border border-dashed border-[#7c6cf0]/20 bg-[#7c6cf0]/[0.03] py-4 text-sm text-[#7c6cf0]/60 hover:border-[#7c6cf0]/30 hover:text-[#7c6cf0]/80 active:scale-[0.99] transition-all disabled:opacity-50"
                  >
                    Connect wallet to upload music
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-white/[0.04] px-6 py-3 flex items-center justify-between">
            <p className="text-[10px] text-white/15">Decentralized Music Ecosystem &middot; Stellar &amp; Soroban</p>
          </div>
        </AnimatedCard>
      </Spotlight>
    </div>
  );
}
