"use client";

import { useState } from "react";

export interface FaqItem {
  question: string;
  answer: string;
}

interface FaqAccordionProps {
  items: readonly FaqItem[];
}

export function FaqAccordion({ items }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const handleToggle = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <div className="space-y-3.5">
      {items.map((item, idx) => {
        const isOpen = openIndex === idx;
        const panelId = `faq-panel-${idx}`;
        const buttonId = `faq-button-${idx}`;

        return (
          <div
            key={item.question}
            className="overflow-hidden rounded-xl border border-border bg-surface transition-colors hover:border-accent-border"
          >
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => handleToggle(idx)}
                className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left text-sm font-semibold text-text-primary transition-colors hover:bg-surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:text-base"
              >
                <span>{item.question}</span>
                <span
                  aria-hidden="true"
                  className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-inner text-accent transition-transform duration-200 ${
                    isOpen ? "rotate-180 border-accent-border" : ""
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </span>
              </button>
            </h3>

            {isOpen && (
              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                className="border-t border-border-subtle bg-surface-inner px-6 py-4 text-xs leading-relaxed text-text-secondary sm:text-sm"
              >
                {item.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
