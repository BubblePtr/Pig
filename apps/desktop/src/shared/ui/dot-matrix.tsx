import type { ComponentProps, CSSProperties } from "react";

const gridSize = 4;
const dotIndexes = Array.from({ length: gridSize * gridSize }, (_, index) => index);

const dotMatrixCss =
  '@property --aui-dot-matrix-hi{syntax:"<number>";inherits:false;initial-value:1}@property --aui-dot-matrix-lo{syntax:"<number>";inherits:false;initial-value:0.15}@keyframes aui-dot-matrix-blink{0%,100%{opacity:var(--aui-dot-matrix-hi,1)}50%{opacity:var(--aui-dot-matrix-lo,0.15)}}';

function classNames(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ");
}

function hash(index: number, salt: number, range: number) {
  let value =
    (Math.imul(index, 374_761_393) + Math.imul(salt, 668_265_263)) >>> 0;

  value = Math.imul(value ^ (value >>> 13), 1_274_126_177) >>> 0;

  return ((value ^ (value >>> 16)) % range) / 1000;
}

export type DotMatrixProps = Omit<ComponentProps<"span">, "children"> & {
  label?: string;
};

export function DotMatrix({
  className,
  label = "loading",
  ...props
}: DotMatrixProps) {
  return (
    <span
      data-slot="dot-matrix"
      data-state="loading"
      role="status"
      className={classNames("inline-block size-4 shrink-0", className)}
      {...props}
    >
      <span className="sr-only">{label}</span>
      <style href="aui-dot-matrix" precedence="low">
        {dotMatrixCss}
      </style>
      <svg
        aria-hidden="true"
        className="size-full"
        fill="currentColor"
        viewBox="0 0 16 16"
      >
        {dotIndexes.map((index) => {
          const row = Math.floor(index / gridSize);
          const col = index % gridSize;
          const duration = 0.9 + hash(index, 2, 700);
          const delay = -hash(index, 1, 1200);

          return (
            <circle
              key={index}
              className="[animation-iteration-count:infinite] [animation-name:aui-dot-matrix-blink] [animation-timing-function:ease-in-out] [transition-property:--aui-dot-matrix-hi,--aui-dot-matrix-lo,opacity] duration-300 motion-reduce:[animation-name:none]"
              cx={2 + col * 4}
              cy={2 + row * 4}
              data-slot="dot-matrix-dot"
              r={1.3}
              style={
                {
                  "--aui-dot-matrix-hi": 1,
                  "--aui-dot-matrix-lo": 0.15,
                  animationDelay: `${delay}s`,
                  animationDuration: `${duration}s`,
                  opacity: 1,
                } as CSSProperties
              }
            />
          );
        })}
      </svg>
    </span>
  );
}
