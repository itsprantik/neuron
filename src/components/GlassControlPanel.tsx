import { useEffect, type CSSProperties } from "react";
import type { LabStore } from "../lab/store";
import { useLab } from "../lab/useLab";
import "./GlassControlPanel.css";

const progress = (value: number, min: number, max: number) =>
  `${((value - min) / (max - min)) * 100}%`;

export default function GlassControlPanel({
  lab,
  onClose,
}: {
  lab: LabStore;
  onClose: () => void;
}) {
  useLab(lab);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const resetSettings = () => {
    lab.setLr(0.3);
    lab.setFlow({ on: true, speed: 60 });
  };

  return (
    <section className="liquid-panel" role="dialog" aria-label="Experiment settings">
      <header className="liquid-header">
        <div>
          <span className="liquid-eyebrow">NEURON CONTROL</span>
          <h2>Experiment settings</h2>
          <p>Adjust your learning environment.</p>
        </div>
        <div className="liquid-status">
          <span className="status-dot" />
          Runs offline
        </div>
      </header>

      <div className="liquid-divider" />

      {/* AI MODEL (not built yet) */}
      <div className="liquid-setting">
        <div className="setting-info">
          <label htmlFor="model">AI Model</label>
          <span>Available when NEURON AI is built</span>
        </div>
        <select id="model" className="glass-select" disabled>
          <option>Not installed</option>
        </select>
      </div>

      {/* LEARNING RATE (real) */}
      <div className="slider-setting">
        <div className="setting-heading">
          <div className="setting-info">
            <label htmlFor="learning-rate">Learning rate</label>
            <span>Controls training step size</span>
          </div>
          <output>{lab.config.lr.toFixed(2)}</output>
        </div>
        <input
          id="learning-rate"
          className="glass-slider"
          type="range"
          min="0.01"
          max="1"
          step="0.01"
          value={lab.config.lr}
          style={{ "--progress": progress(lab.config.lr, 0.01, 1) } as CSSProperties}
          onChange={(e) => lab.setLr(Number(e.target.value))}
        />
        <div className="slider-labels">
          <span>Precise</span>
          <span>Fast</span>
        </div>
      </div>

      {/* TEMPERATURE (not built yet) */}
      <div className="slider-setting">
        <div className="setting-heading">
          <div className="setting-info">
            <label htmlFor="temperature">AI Temperature</label>
            <span>Available when NEURON AI is built</span>
          </div>
          <output>0.7</output>
        </div>
        <input
          id="temperature"
          className="glass-slider"
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={0.7}
          disabled
          style={{ "--progress": progress(0.7, 0, 2) } as CSSProperties}
          readOnly
        />
        <div className="slider-labels">
          <span>Focused</span>
          <span>Creative</span>
        </div>
      </div>

      {/* ANIMATION SPEED (real: speed of the signal dots) */}
      <div className="slider-setting">
        <div className="setting-heading">
          <div className="setting-info">
            <label htmlFor="animation-speed">Animation speed</label>
            <span>Speed of the signal dots in the network</span>
          </div>
          <output>{lab.flowSpeed}%</output>
        </div>
        <input
          id="animation-speed"
          className="glass-slider"
          type="range"
          min="0"
          max="100"
          value={lab.flowSpeed}
          disabled={!lab.flow}
          style={{ "--progress": `${lab.flowSpeed}%` } as CSSProperties}
          onChange={(e) => lab.setFlow({ speed: Number(e.target.value) })}
        />
      </div>

      <div className="liquid-divider" />

      {/* LIGHT THEME (not built yet) */}
      <div className="liquid-setting">
        <div className="setting-info">
          <label>Dark appearance</label>
          <span>NEURON is dark only for now</span>
        </div>
        <button
          className="glass-switch active"
          role="switch"
          aria-checked={true}
          aria-label="Dark appearance"
          disabled
        >
          <span />
        </button>
      </div>

      {/* SIGNAL ANIMATION (real) */}
      <div className="liquid-setting">
        <div className="setting-info">
          <label>Animations</label>
          <span>Signal dots in the network</span>
        </div>
        <button
          className={`glass-switch ${lab.flow ? "active" : ""}`}
          role="switch"
          aria-checked={lab.flow}
          aria-label="Animations"
          onClick={() => lab.setFlow({ on: !lab.flow })}
        >
          <span />
        </button>
      </div>

      <footer className="liquid-footer">
        <span>Changes apply locally</span>
        <button className="reset-button" onClick={resetSettings}>
          Reset settings
        </button>
      </footer>
    </section>
  );
}