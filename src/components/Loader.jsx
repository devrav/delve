export default function Loader() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div
        className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"
        role="status"
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
}
