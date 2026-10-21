import { Hero } from "./Hero/Hero";
import { Marquee } from "./Marquee/Marquee";
import { Introduction } from "./Introduction/Introduction";
import { ServicesSection } from "./ServicesSection/ServicesSection";
import { Conversation } from "./Conversation/Conversation";
import { Collaboration } from "./Collaboration/Collaboration";
import { SelectedWork } from "./SelectedWork/SelectedWork";
import { Consultants } from "./Consultants/Consultants";
import { ClientFeedback } from "./ClientFeedback/ClientFeedback";
import { Perspective } from "./Perspective/Perspective";
import { Activity } from "./Activity/Activity";

import { SectionReveal } from "./SectionReveal/SectionReveal";

import "./Home.css";

export default function Home() {
  return (
    <>
      <Hero />

      <Marquee />

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

      <ClientFeedback />

      <Perspective />

      <Activity />
    </>
  );
}
