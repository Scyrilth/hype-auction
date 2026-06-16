"use client";

import { useState } from "react";

import { ChevronDownIcon } from "@/components/icons";
import type { FaqCategory, FaqItem } from "@/lib/legal/faq-data";

function FaqAccordionItem({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`rounded-xl border transition-colors duration-200 ${
        open
          ? "border-accent/50 bg-accent/5"
          : "border-border bg-surface hover:border-border/80"
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-start justify-between gap-3 px-4 py-4 text-left sm:px-5"
      >
        <span
          className={`text-sm font-medium leading-snug ${
            open ? "text-white" : "text-zinc-300"
          }`}
        >
          {item.question}
        </span>
        <ChevronDownIcon
          className={`mt-0.5 h-4 w-4 shrink-0 text-muted transition-transform duration-200 ${
            open ? "rotate-180 text-accent" : ""
          }`}
        />
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-out ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="space-y-3 px-4 pb-4 text-sm leading-relaxed text-zinc-400 sm:px-5 sm:pb-5">
            {item.answer && <p>{item.answer}</p>}
            {item.steps && (
              <ol className="space-y-3">
                {item.steps.map((step) => (
                  <li key={step.title}>
                    <p className="font-medium text-zinc-300">{step.title}</p>
                    <p className="mt-1">{step.body}</p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FaqView({ categories }: { categories: FaqCategory[] }) {
  return (
    <div className="space-y-10">
      {categories.map((category) => (
        <section key={category.title}>
          <h2 className="mb-4 text-lg font-semibold text-purple-300">
            {category.title}
          </h2>
          <div className="space-y-2">
            {category.items.map((item) => (
              <FaqAccordionItem key={item.question} item={item} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
