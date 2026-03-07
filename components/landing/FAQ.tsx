"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { T } from "@/lib/tokens";

const FAQ_ITEMS = [
  {
    question: "Is the AI-generated content safe for children?",
    answer: "Yes. Every story is generated with strict content safety guardrails that prohibit violence, inappropriate content, and harmful themes. Our AI system prompt enforces age-appropriate language, classical moral framing, and positive character outcomes. That said, AI can occasionally produce unexpected results \u2014 we always recommend parents review stories before sharing with children.",
  },
  {
    question: "How is this different from ChatGPT?",
    answer: "Virtue Forge is purpose-built for character education. Unlike general-purpose AI chatbots, our stories are grounded in the Aristotelian virtue framework (Prudence, Justice, Courage, Temperance) with 2,400 years of philosophical tradition behind them. Every story is calibrated to your child\u2019s age, reading level, and real-life struggles \u2014 and includes discussion questions and family activities. We also offer 57+ hand-curated classic books mapped to specific virtues.",
  },
  {
    question: "Who curated the book library?",
    answer: "Our library of 57+ books was hand-selected from 2,600 years of children\u2019s literature \u2014 from Aesop\u2019s Fables to modern classics. Each book was chosen for moral clarity, narrative quality, and age-appropriateness, then mapped to specific virtues and reading levels. We include both Amazon links and free public domain editions where available.",
  },
  {
    question: "What ages is Virtue Forge designed for?",
    answer: "Virtue Forge supports children from Pre-K (ages 2\u20134) through Middle School (ages 12\u201314). AI-generated stories are automatically calibrated to your child\u2019s age and reading level \u2014 shorter and simpler for younger children, more complex for older ones. Our book library spans the same range with reading level filters.",
  },
  {
    question: "Is my child\u2019s data private?",
    answer: "Absolutely. When used without an account, all data stays on your device in browser storage \u2014 we never see it. When you generate a story, your child\u2019s first name, age, and situation are sent securely to our AI provider (Anthropic) to generate the story, then immediately discarded. We don\u2019t store child data on our servers, don\u2019t use it for advertising, and don\u2019t sell it. See our Privacy Policy for full details.",
  },
  {
    question: "Do I need to pay to use Virtue Forge?",
    answer: "No. The free tier includes access to our full 57-book library, 3 AI-generated stories per month, basic virtue tracking, and one child profile. Premium unlocks unlimited stories, unlimited child profiles, printable PDFs, and advanced tracking. You can use the free tier indefinitely.",
  },
  {
    question: "What virtues does Virtue Forge teach?",
    answer: "We use the four cardinal virtues from the Aristotelian-Thomistic tradition: Prudence (wisdom), Justice (right relationship with others), Courage (strength of heart), and Temperance (self-mastery). Each cardinal virtue has four sub-virtues \u2014 16 virtues total, including curiosity, honesty, perseverance, patience, generosity, resilience, and more.",
  },
];

function FAQItem({ item, isOpen, onToggle }: {
  item: typeof FAQ_ITEMS[0];
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div style={{
      borderRadius: T.radius, border: `1px solid ${T.gray100}`,
      background: T.white, overflow: "hidden",
    }}>
      <button onClick={onToggle} style={{
        width: "100%", padding: "20px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 16, background: "none", border: "none", cursor: "pointer",
        textAlign: "left",
      }}>
        <span style={{
          fontFamily: T.fontSans, fontSize: 16, fontWeight: 600,
          color: T.navy, lineHeight: 1.4,
        }}>
          {item.question}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ flexShrink: 0 }}
        >
          <ChevronDown size={18} color={T.gray400} />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{
              padding: "0 24px 20px",
              fontFamily: T.fontSans, fontSize: 15, color: T.gray500,
              lineHeight: 1.7,
            }}>
              {item.answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {FAQ_ITEMS.map((item, i) => (
        <FAQItem
          key={i}
          item={item}
          isOpen={openIndex === i}
          onToggle={() => setOpenIndex(openIndex === i ? null : i)}
        />
      ))}
    </div>
  );
}
