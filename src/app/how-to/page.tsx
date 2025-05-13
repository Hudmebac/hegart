
import type { Metadata } from 'next';
import Link from 'next/link';
import { HowToGuide } from '@/components/guides/HowToGuide';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'How to Use #HegArt - A Comprehensive Guide',
  description: 'Learn how to use all the features of #HegArt to create stunning symmetric and animated artwork. From basic drawing to advanced animation and symmetry controls.',
};

export default function HowToPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl md:text-4xl font-bold">
            How to Use #HegArt
          </h1>
          <Button asChild variant="outline" size="sm">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to App
            </Link>
          </Button>
        </div>
        <HowToGuide />
      </div>
    </div>
  );
}
