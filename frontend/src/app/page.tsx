'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import React from 'react';
// Removed Image import as we are removing default Next.js/Vercel logos for now
// import Image from "next/image"; 

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8">
      <main className="flex flex-col items-center text-center gap-8 max-w-2xl">
        {/* Removed Next.js Logo and initial list items */}
        
        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl text-foreground">
          Welcome to the AI Marketing Agent
        </h1>
        <p className="text-xl text-muted-foreground">
          Generate marketing strategies, get content ideas, and analyze performance seamlessly.
        </p>
        <Link href="/dashboard" passHref>
          <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-4 px-10 rounded-lg shadow-xl transition duration-300 ease-in-out transform hover:scale-105 text-lg">
            Get Started
          </Button>
        </Link>
      </main>
      <footer className="absolute bottom-8 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} AI Marketing Agent. All rights reserved.</p>
        {/* Removed Vercel and Next.js promotional links from footer */}
      </footer>
    </div>
  );
}
