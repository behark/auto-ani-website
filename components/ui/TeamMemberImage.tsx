'use client';

import FallbackImage from './FallbackImage';

interface TeamMemberImageProps {
  name: string;
  position: string;
  image: string;
  size?: number;
}

/**
 * Team member image component with automatic fallback
 * Displays team member photo with fallback to initials
 */
export default function TeamMemberImage({
  name,
  position,
  image,
  size = 300
}: TeamMemberImageProps) {
  // Generate initials for fallback
  const getInitials = (fullName: string) => {
    const names = fullName.split(' ');
    return names.map(n => n[0]).join('').toUpperCase();
  };

  const initials = getInitials(name);

  return (
    <div className="relative group">
      <div className={`relative overflow-hidden rounded-lg shadow-lg`}
           style={{ width: size, height: size }}>
        <FallbackImage
          src={image}
          alt={`${name} - ${position}`}
          width={size}
          height={size}
          className="object-cover transition-transform duration-300 group-hover:scale-110"
          fallbackSrc={`/images/team/${name.toLowerCase().replace(' ', '-')}.jpg`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      <div className="mt-4 text-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{name}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">{position}</p>
      </div>
    </div>
  );
}