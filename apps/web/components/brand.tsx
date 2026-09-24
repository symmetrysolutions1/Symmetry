import Link from "next/link";

export function Brand() {
  return (
    <Link className="sym-brand" href="/" aria-label="Symmetry Enterprises, inicio">
      <svg className="sym-brand-logo" viewBox="200 380 1100 750" role="img" aria-hidden="true">
        <image href="/brand/logo-symmetry-source.svg" x="0" y="0" width="1500" height="1500" />
      </svg>
    </Link>
  );
}
