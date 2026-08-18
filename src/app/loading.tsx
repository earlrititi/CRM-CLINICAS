export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8f4] px-6">
      <div className="w-full max-w-sm rounded-lg border border-[#d9ded6] bg-white p-6 shadow-sm">
        <div className="h-3 w-24 rounded bg-[#dff5ef]" />
        <div className="mt-5 h-6 w-48 rounded bg-[#eef3ed]" />
        <div className="mt-3 h-3 w-full rounded bg-[#eef3ed]" />
        <div className="mt-2 h-3 w-5/6 rounded bg-[#eef3ed]" />
      </div>
    </main>
  );
}
