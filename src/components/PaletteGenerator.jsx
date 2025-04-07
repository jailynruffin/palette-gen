import React, { useState, useEffect, useRef } from "react";
import ColorCard from "./ColorCard";
import html2canvas from "html2canvas";

function generateHarmonyColors(mode, baseHex) {
  const hexToHSL = (hex) => {
    let r = parseInt(hex.slice(1, 3), 16) / 255;
    let g = parseInt(hex.slice(3, 5), 16) / 255;
    let b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) h = s = 0;
    else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)); break;
        case g: h = ((b - r) / d + 2); break;
        case b: h = ((r - g) / d + 4); break;
      }
      h *= 60;
    }

    return { h, s: s * 100, l: l * 100 };
  };

  const hslToHex = (h, s, l) => {
    s /= 100;
    l /= 100;

    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n =>
      Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))));

    return `#${[f(0), f(8), f(4)].map(x => x.toString(16).padStart(2, '0')).join('')}`;
  };

  const base = hexToHSL(baseHex);
  const angles = {
    complementary: [0, 180],
    analogous: [-30, 0, 30],
    triadic: [0, 120, 240],
  };

  const shifts = angles[mode] || Array(5).fill().map(() => Math.floor(Math.random() * 360));
  const hues = shifts.map(shift => (base.h + shift + 360) % 360);

  const variations = hues.flatMap(hue => [
    hslToHex(hue, base.s, Math.max(Math.min(base.l - 10, 100), 0)),
    hslToHex(hue, base.s, base.l),
    hslToHex(hue, base.s, Math.min(base.l + 10, 100)),
  ]);

  return variations.slice(0, 5);
}

function generateRandomColor() {
  const pastelHue = () => Math.floor(Math.random() * 100 + 155);
  const r = pastelHue();
  const g = pastelHue();
  const b = pastelHue();
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export default function PaletteGenerator() {
  const [colors, setColors] = useState(
    Array(5).fill().map(() => ({
      hex: generateRandomColor(),
      locked: false,
    }))
  );

  const [savedPalettes, setSavedPalettes] = useState([]);
  const [paletteName, setPaletteName] = useState("");
  const [harmonyMode, setHarmonyMode] = useState("random");
  const paletteRef = useRef(null);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("palettes") || "[]");
    setSavedPalettes(stored);
  }, []);

  const regenerateColors = () => {
    let baseColor = colors.find(c => c.locked)?.hex || generateRandomColor();
    let newHexes = generateHarmonyColors(harmonyMode, baseColor);
    const newColors = colors.map((color, i) =>
      color.locked ? color : { ...color, hex: newHexes[i % newHexes.length] }
    );
    setColors(newColors);
  };

  const toggleLock = (index) => {
    const updated = [...colors];
    updated[index].locked = !updated[index].locked;
    setColors(updated);
  };

  const handleSavePalette = () => {
    if (!paletteName.trim()) return;
    const currentColors = colors.map(color => color.hex);
    const newPalette = { name: paletteName.trim(), colors: currentColors };
    const updatedPalettes = [...savedPalettes, newPalette];
    localStorage.setItem("palettes", JSON.stringify(updatedPalettes));
    setSavedPalettes(updatedPalettes);
    setPaletteName("");
  };

  const handleDeletePalette = (indexToDelete) => {
    const updated = savedPalettes.filter((_, index) => index !== indexToDelete);
    localStorage.setItem("palettes", JSON.stringify(updated));
    setSavedPalettes(updated);
  };

  const handleClearPalettes = () => {
    localStorage.removeItem("palettes");
    setSavedPalettes([]);
  };

  const handleExport = () => {
    html2canvas(paletteRef.current).then((canvas) => {
      const link = document.createElement("a");
      link.download = "palette.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    });
  };

  return (
    <div>
      <div className="palette-grid" ref={paletteRef}>
        {colors.map((color, index) => (
          <ColorCard
            key={index}
            hex={color.hex}
            isLocked={color.locked}
            toggleLock={() => toggleLock(index)}
          />
        ))}
      </div>

      <div className="button-stack">
        <button className="generate-button" onClick={regenerateColors}>
          Generate ✨
        </button>
        <input
          type="text"
          placeholder="Name your palette"
          value={paletteName}
          onChange={(e) => setPaletteName(e.target.value)}
          className="name-input"
        />
        <button className="save-button" onClick={handleSavePalette}>
          Save Palette ⭐
        </button>

        <select
          className="harmony-select cute-dropdown"
          value={harmonyMode}
          onChange={(e) => setHarmonyMode(e.target.value)}
        >
          <option value="random">🎲 Random</option>
          <option value="complementary">🎯 Complementary</option>
          <option value="analogous">🌀 Analogous</option>
          <option value="triadic">🧿 Triadic</option>
        </select>

        <button className="export-button" onClick={handleExport}>
          Export as PNG 🖼️
        </button>

        <button className="clear-button" onClick={handleClearPalettes}>
          Clear All
        </button>
      </div>

      <div className="saved-palettes">
        <h3>Saved Palettes</h3>
        <div className="saved-grid">
          {savedPalettes.map((palette, index) => (
            <div key={index} className="saved-palette">
              <div
                className="swatch-row"
                onClick={() =>
                  setColors(palette.colors.map(hex => ({ hex, locked: false })))
                }
              >
                {palette.colors.map((hex, i) => (
                  <div key={i} className="saved-swatch" style={{ backgroundColor: hex }} />
                ))}
              </div>
              <div className="palette-footer">
                <span className="palette-name">{palette.name}</span>
                <button className="delete-button" onClick={() => handleDeletePalette(index)}>
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
