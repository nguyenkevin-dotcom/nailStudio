import { Sparkles } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-primary shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-center sm:justify-start">
        <Sparkles className="h-8 w-8 text-primary-foreground mr-3" />
        <h1 className="text-3xl font-headline font-bold text-primary-foreground">
          GlamBook
        </h1>
      </div>
    </header>
  );
}
