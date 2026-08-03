import Link from "next/link";

export function Brand() {
  return (
    <Link className="sym-brand" href="/" aria-label="Symmetry Enterprises, inicio">
      <span className="sym-brand-official" aria-hidden="true" />
    </Link>
  );
}
