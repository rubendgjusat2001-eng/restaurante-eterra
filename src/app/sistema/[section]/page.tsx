'use client';

import { use } from 'react';
import { SistemaApp } from '@/components/internal/SistemaApp';

interface PageProps {
  params: Promise<{ section: string }>;
}

export default function SistemaSectionPage({ params }: PageProps) {
  const resolvedParams = use(params);
  return <SistemaApp initialSection={resolvedParams.section} />;
}
