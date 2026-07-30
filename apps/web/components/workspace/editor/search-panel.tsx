"use client";

import { useEffect, useRef } from "react";
import { XIcon, ChevronUpIcon, ChevronDownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchPanelProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onClose: () => void;
  onFindNext: () => void;
  onFindPrevious: () => void;
  matchCount: number;
  currentMatch: number;
  showReplace: boolean;
  onToggleReplace: () => void;
  replaceQuery: string;
  onReplaceQueryChange: (query: string) => void;
  onReplaceOne: () => void;
  onReplaceAll: () => void;
}

export function SearchPanel({
  searchQuery,
  onSearchQueryChange,
  onClose,
  onFindNext,
  onFindPrevious,
  matchCount,
  currentMatch,
  showReplace,
  onToggleReplace,
  replaceQuery,
  onReplaceQueryChange,
  onReplaceOne,
  onReplaceAll,
}: SearchPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (e.shiftKey) {
        onFindPrevious();
      } else {
        onFindNext();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  const handleReplaceKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (e.metaKey || e.ctrlKey) {
        onReplaceAll();
      } else {
        onReplaceOne();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div className="flex flex-col border-border border-b bg-[#282c34]">
      <div className="flex h-9 items-center gap-2 px-2">
        <button
          onClick={onToggleReplace}
          className="rounded p-0.5 text-[#abb2bf] transition-colors hover:bg-white/10"
          title={showReplace ? "Hide replace" : "Show replace"}
        >
          <ChevronDownIcon
            className={cn(
              "size-3.5 transition-transform",
              !showReplace && "-rotate-90",
            )}
          />
        </button>
        <Input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          placeholder="Search..."
          className="h-6 w-48 bg-[#1e2127] text-[#abb2bf] text-sm placeholder:text-[#636d83]"
        />
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="size-6 text-[#abb2bf] hover:bg-white/10 hover:text-[#abb2bf]"
            onClick={onFindPrevious}
            disabled={!searchQuery || matchCount === 0}
          >
            <ChevronUpIcon className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-6 text-[#abb2bf] hover:bg-white/10 hover:text-[#abb2bf]"
            onClick={onFindNext}
            disabled={!searchQuery || matchCount === 0}
          >
            <ChevronDownIcon className="size-4" />
          </Button>
        </div>
        {searchQuery && (
          <span className="text-[#636d83] text-xs">
            {matchCount === 0
              ? "No results"
              : `${currentMatch} of ${matchCount}`}
          </span>
        )}
        <div className="flex-1" />
        <Button
          variant="ghost"
          size="icon"
          className="size-6 text-[#abb2bf] hover:bg-white/10 hover:text-[#abb2bf]"
          onClick={onClose}
        >
          <XIcon className="size-4" />
        </Button>
      </div>
      {showReplace && (
        <div className="flex h-9 items-center gap-2 px-2 pb-2">
          <div className="size-3.5 shrink-0" />
          <Input
            type="text"
            value={replaceQuery}
            onChange={(e) => onReplaceQueryChange(e.target.value)}
            onKeyDown={handleReplaceKeyDown}
            placeholder="Replace..."
            className="h-6 w-48 bg-[#1e2127] text-[#abb2bf] text-sm placeholder:text-[#636d83]"
          />
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-[#abb2bf] text-xs hover:bg-white/10 hover:text-[#abb2bf]"
            onClick={onReplaceOne}
            disabled={!searchQuery || matchCount === 0}
          >
            Replace
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-[#abb2bf] text-xs hover:bg-white/10 hover:text-[#abb2bf]"
            onClick={onReplaceAll}
            disabled={!searchQuery || matchCount === 0}
          >
            Replace All
          </Button>
        </div>
      )}
    </div>
  );
}
