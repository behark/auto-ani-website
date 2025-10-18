interface LoadingSkeletonsProps {
  type: 'featured-vehicles' | 'services' | 'generic' | 'testimonials';
  count?: number;
}

export default function LoadingSkeletons({ type, count = 3 }: LoadingSkeletonsProps) {
  if (type === 'featured-vehicles') {
    return (
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="h-10 w-64 bg-gray-200 rounded mx-auto mb-4 animate-pulse" />
            <div className="h-6 w-96 bg-gray-200 rounded mx-auto animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg overflow-hidden shadow">
                <div className="h-48 bg-gray-200 animate-pulse" />
                <div className="p-6">
                  <div className="h-6 bg-gray-200 rounded mb-2 animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4 animate-pulse" />
                  <div className="flex gap-2">
                    <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
                    <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (type === 'services') {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="text-center">
                <div className="h-16 w-16 bg-gray-200 rounded-full mx-auto mb-4 animate-pulse" />
                <div className="h-6 bg-gray-200 rounded mb-2 animate-pulse" />
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (type === 'testimonials') {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow">
                <div className="h-20 bg-gray-200 rounded mb-4 animate-pulse" />
                <div className="flex items-center">
                  <div className="h-12 w-12 bg-gray-200 rounded-full animate-pulse" />
                  <div className="ml-4">
                    <div className="h-4 w-24 bg-gray-200 rounded mb-2 animate-pulse" />
                    <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Generic skeleton
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="space-y-4">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    </section>
  );
}