import { Hero } from "./Hero/Hero";
import { Introduction } from "./Introduction/Introduction";
import { ServicesSection } from "./ServicesSection/ServicesSection";
import { Conversation } from "./Conversation/Conversation";
import { Collaboration } from "./Collaboration/Collaboration";
import { SelectedWork } from "./SelectedWork/SelectedWork";
import { Consultants } from "./Consultants/Consultants";

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

      <SelectedWork />

      <Consultants />
      
    </>
  );
}
