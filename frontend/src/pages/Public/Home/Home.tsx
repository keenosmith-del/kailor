
import { Hero } from "./Hero/Hero";
import { Introduction } from "./Introduction/Introduction";
import { ServicesSection } from "./ServicesSection/ServicesSection";
import { ClientJourneys } from "./ClientJourneys/ClientJourneys";
import { Conversation } from "./Conversation/Conversation";
import { Process } from "./Process/Process";
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
        <ClientJourneys />
      </SectionReveal>

      <SectionReveal>
        <Conversation />
      </SectionReveal>

      <SectionReveal>
        <Process />
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
