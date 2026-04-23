import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <h1 className="text-6xl text-accent mb-3 font-serif">404</h1>
        <p className="text-muted-foreground mb-8 font-sans">
          页面不存在，去看看日记吧~
        </p>
        <Link
          href="/"
          className="inline-block px-8 py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent-hover transition-colors"
        >
          返回首页
        </Link>
      </div>
    </main>
  );
}
