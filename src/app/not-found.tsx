import Link from "next/link";

export default function RootNotFound() {
  return (
    <main className="shell legal-page">
      <p className="eyebrow">404</p>
      <h1>Page not found.</h1>
      <p className="legal-page__notice">
        The requested route is not part of this documentation website.
      </p>
      <p>
        <Link href="/" className="button">
          Return home
        </Link>
      </p>
    </main>
  );
}
