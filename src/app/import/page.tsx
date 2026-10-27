'use client';

import React from 'react';
import { PlaylistImporter } from '@/components/import/PlaylistImporter';

export default function ImportPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      <PlaylistImporter />
    </div>
  );
}

