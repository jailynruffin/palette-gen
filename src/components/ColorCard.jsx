import React, { useState } from "react";
import { Lock, Unlock } from "lucide-react";

export default function ColorCard({ hex, isLocked, toggleLock }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(hex);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      className="color-card"
      style={{ backgroundColor: hex }}
      onClick={handleCopy}
    >
      <span className="hex">{hex}</span>

      <div className="lock" onClick={(e) => { e.stopPropagation(); toggleLock(); }}>
        {isLocked ? <Lock size={18} /> : <Unlock size={18} />}
      </div>

      {/* Copy message */}
      {copied && <span className="copy-message">Copied!</span>}
    </div>
  );
}
