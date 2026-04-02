import { ReactNode } from 'react';

interface MovieRowProps {
  title: string;
  children: ReactNode;
}

export default function MovieRow({ title, children }: MovieRowProps) {
  return (
    <section className="mb-8 md:mb-11">
      <h2 className="mb-3 px-4 text-[1.05rem] font-medium tracking-wide text-white md:mb-4 md:px-8 md:text-lg lg:px-12">
        {title}
      </h2>
      <div
        className="flex gap-2 overflow-x-auto overflow-y-visible px-4 pb-4 pt-1 scrollbar-hide scroll-smooth sm:gap-2.5 md:px-8 lg:gap-3 lg:px-12"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {children}
      </div>
    </section>
  );
}
