import { Hero } from "./Hero/Hero";
import { Introduction } from "./Introduction/Introduction";
import { ServicesSection } from "./ServicesSection/ServicesSection";
import { Conversation } from "./Conversation/Conversation";
import { Collaboration } from "./Collaboration/Collaboration";
import { Outcomes } from "./Outcomes/Outcomes";

import { Intelligence } from "./Intelligence/Intelligence";
import { Insights } from "./Insights/Insights";
import { SelectedWork } from "./SelectedWork/SelectedWork";
import { EngagementSection } from "./EngagementSection/EngagementSection";
import { Closing } from "./Closing/Closing";
import { SectionReveal } from "./SectionReveal/SectionReveal";

import "./Home.css";

export default function Home() {
  return (
    <>
      <SectionReveal>
        <Hero />
      </SectionReveal>

      <SectionReveal>
        <Introduction />
      </SectionReveal>

      <SectionReveal>
        <ServicesSection />
      </SectionReveal>

      <SectionReveal>
        <Conversation />
      </SectionReveal>

      <SectionReveal>
        <Collaboration />
      </SectionReveal>

      <SectionReveal>
        <Outcomes />
      </SectionReveal>

      <SectionReveal>
        <Intelligence />
      </SectionReveal>

      <SectionReveal>
        <Insights />
      </SectionReveal>

      <SectionReveal>
        <SelectedWork />
      </SectionReveal>

      <SectionReveal>
        <EngagementSection />
      </SectionReveal>

      <SectionReveal>
        <Closing />
      </SectionReveal>
    </>
  );
}
