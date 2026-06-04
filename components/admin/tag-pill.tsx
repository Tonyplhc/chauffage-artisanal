/**
 * Pill réutilisable pour afficher un tag avec sa couleur d'identité.
 */

export type TagShape = {
  id: string;
  label: string;
  color: string;
};

export function TagPill({
  tag,
  size = "md",
  onRemove,
}: {
  tag: TagShape;
  size?: "sm" | "md";
  onRemove?: () => void;
}) {
  const px = size === "sm" ? "px-2 py-0.5" : "px-2.5 py-1";
  const text = size === "sm" ? "text-[10px]" : "text-xs";
  return (
    <span
      className={`inline-flex items-center gap-1.5 ${px} rounded-full ${text} font-medium`}
      style={{
        background: `${tag.color}1c`,
        color: tag.color,
        border: `1px solid ${tag.color}40`,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: tag.color }}
      />
      <span className="truncate max-w-[140px]">{tag.label}</span>
      {onRemove && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 -mr-0.5 h-3.5 w-3.5 grid place-items-center rounded-full hover:bg-current/10"
          aria-label="Retirer ce tag"
          style={{ color: tag.color }}
        >
          <span aria-hidden>×</span>
        </button>
      )}
    </span>
  );
}
