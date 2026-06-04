"use client";

/**
 * Pad de signature client (canvas).
 *
 * - Compatible souris + tactile (pointer events).
 * - Exporte en data-URL PNG via `toDataURL("image/png")`.
 * - "Effacer" remet à blanc. "Valider" appelle onCapture(dataUrl).
 * - Si `readonly` ou `value` fourni : affiche la signature en image (pas de pad).
 *
 * Le composant ne stocke pas lui-même — le parent gère le state et la persistance.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { Eraser, PenLine, Check } from "lucide-react";

type Props = {
  value?: string; // data-URL existant — affiche en lecture
  signerName?: string;
  signedAt?: string;
  onCapture?: (dataUrl: string, signerName: string) => void;
  onClear?: () => void;
  readonly?: boolean;
};

export function SignaturePad({
  value,
  signerName: existingSignerName,
  signedAt,
  onCapture,
  onClear,
  readonly = false,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const [hasInk, setHasInk] = useState(false);
  const [signerName, setSignerName] = useState("");

  // Adapte la résolution du canvas au DPR pour un trait net
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#2a251e"; // ink
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, rect.width, rect.height);
  }, []);

  useEffect(() => {
    if (value || readonly) return;
    setupCanvas();
    const onResize = () => setupCanvas();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [value, readonly, setupCanvas]);

  const getPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (readonly || value) return;
    e.preventDefault();
    (e.target as Element).setPointerCapture(e.pointerId);
    drawingRef.current = true;
    lastPointRef.current = getPoint(e);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const p = getPoint(e);
    const last = lastPointRef.current ?? p;
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    lastPointRef.current = p;
    if (!hasInk) setHasInk(true);
  };

  const end = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    lastPointRef.current = null;
    try {
      (e.target as Element).releasePointerCapture(e.pointerId);
    } catch {}
  };

  const clear = () => {
    setupCanvas();
    setHasInk(false);
  };

  const capture = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const name = signerName.trim();
    if (!name) return;
    const dataUrl = canvas.toDataURL("image/png");
    onCapture?.(dataUrl, name);
  };

  // ── Mode lecture : signature déjà capturée
  if (value) {
    return (
      <div className="rounded-2xl border border-ink/10 bg-white p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
            Signature client
          </div>
          {!readonly && onClear && (
            <button
              type="button"
              onClick={onClear}
              className="text-[10px] font-mono text-ember hover:underline print:hidden"
            >
              Effacer et resigner
            </button>
          )}
        </div>
        <div className="rounded-xl bg-white border border-ink/8 p-2 inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt={`Signature de ${existingSignerName ?? "client"}`}
            className="max-h-32 object-contain"
          />
        </div>
        <div className="mt-2 text-xs text-graphite">
          Signé par{" "}
          <strong className="text-ink">{existingSignerName ?? "—"}</strong>
          {signedAt && (
            <>
              {" "}
              · le{" "}
              <span className="font-mono">
                {new Date(signedAt).toLocaleString("fr-FR", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </span>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Mode capture
  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-4 print:hidden">
      <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-2">
        Signature client
      </div>
      <div className="text-xs text-muted mb-3">
        Le client signe ci-dessous pour attester de la conformité de la
        prestation. Touche : doigt / stylet / souris.
      </div>
      <label className="block mb-1.5">
        <span className="font-mono text-[10px] uppercase tracking-eyebrow text-graphite">
          Nom du signataire
          <span className="text-ember ml-1">*</span>
        </span>
      </label>
      <input
        type="text"
        value={signerName}
        onChange={(e) => setSignerName(e.target.value)}
        placeholder="ex : M. Schmitz"
        disabled={readonly}
        required
        className="w-full mb-3 bg-cream border border-ink/15 rounded-lg px-3 py-2 text-sm focus:border-copper focus:outline-none"
      />
      <div
        className="relative rounded-xl border-2 border-dashed border-ink/15 bg-cream/30 overflow-hidden"
        style={{ touchAction: "none" }}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={start}
          onPointerMove={draw}
          onPointerUp={end}
          onPointerCancel={end}
          className="block w-full h-40 cursor-crosshair"
        />
        {!hasInk && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center text-muted text-xs">
            <span className="inline-flex items-center gap-1.5">
              <PenLine className="h-3 w-3" />
              Signez ici
            </span>
          </div>
        )}
      </div>
      <div className="mt-3 flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={clear}
          disabled={!hasInk || readonly}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-ink/15 text-xs hover:border-ember/40 hover:text-ember transition-colors disabled:opacity-40"
        >
          <Eraser className="h-3 w-3" />
          Effacer
        </button>
        <button
          type="button"
          onClick={capture}
          disabled={!hasInk || !signerName.trim() || readonly}
          title={
            !hasInk
              ? "Trace d'abord la signature dans le cadre"
              : !signerName.trim()
                ? "Renseigne le nom du signataire"
                : "Valider et envoyer au serveur"
          }
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-ink text-cream text-xs hover:bg-copper transition-colors disabled:opacity-40 ml-auto"
        >
          <Check className="h-3 w-3" />
          Valider la signature
        </button>
      </div>

      {/* Message d'aide explicite — dit pourquoi le bouton est désactivé */}
      {(!hasInk || !signerName.trim()) && (
        <div className="mt-2 text-[11px] text-ember bg-ember/8 border border-ember/25 rounded-lg px-2.5 py-1.5 flex items-start gap-1.5">
          <span className="text-ember mt-px">⚠</span>
          <span>
            {!signerName.trim() && !hasInk
              ? "Renseigne le nom du signataire et trace la signature pour pouvoir valider."
              : !signerName.trim()
                ? "Renseigne le nom du signataire avant de valider."
                : "Trace la signature dans le cadre avant de valider."}
          </span>
        </div>
      )}
    </div>
  );
}
