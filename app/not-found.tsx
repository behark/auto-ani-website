import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center px-4">
        <h1 className="text-9xl font-bold text-orange-500">404</h1>
        <h2 className="text-3xl font-semibold mt-4 mb-2">
          Faqja nuk u gjet
        </h2>
        <p className="text-gray-600 mb-8">
          Faqja që po kërkoni nuk ekziston ose është zhvendosur.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/">
            <Button className="bg-orange-500 hover:bg-orange-600">
              Kthehu në shtëpi
            </Button>
          </Link>
          <Link href="/vehicles">
            <Button variant="outline">
              Shiko Automjetet
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}