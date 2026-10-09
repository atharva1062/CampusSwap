import React, { useState } from 'react';
import { User } from 'lucide-react';

/**
 * Default Blank Contact Avatar Component
 * Displays a clean neutral blank contact silhouette image/icon when no custom picture is set.
 */
export default function Avatar({
  src,
  alt = 'Contact',
  className = 'w-9 h-9',
  iconClassName = 'w-1/2 h-1/2',
}) {
  const [imageError, setImageError] = useState(false);

  // If no source is provided or image failed to load, show default blank contact silhouette
  if (!src || imageError) {
    return (
      <div
        className={`rounded-full bg-slate-200/90 border border-slate-300/80 text-slate-500 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden select-none ${className}`}
        title={alt}
      >
        <User className={`stroke-[2] text-slate-400 ${iconClassName}`} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setImageError(true)}
      className={`rounded-full object-cover shrink-0 border border-slate-200/80 ${className}`}
    />
  );
}
