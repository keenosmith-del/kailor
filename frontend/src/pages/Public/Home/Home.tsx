import { ClientPerspectives } from "./ClientPerspectives/ClientPerspectives";
import { Hero } from "./Hero/Hero";
import { Marquee } from "./Marquee/Marquee";
import { Introduction } from "./Introduction/Introduction";
import { ServicesSection } from "./ServicesSection/ServicesSection";
import { Conversation } from "./Conversation/Conversation";
import { Collaboration } from "./Collaboration/Collaboration";
import { Perspective } from "./Perspective/Perspective";
import { WhatWeveBuilt } from "./WhatWeveBuilt/WhatWeveBuilt";
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

      <ServicesSection />

      <SectionReveal>
        <Conversation />
      </SectionReveal>

      <SectionReveal>
        <Collaboration />
      </SectionReveal>

      <WhatWeveBuilt />

      <ClientPerspectives />

      <Perspective />

      <Activity />
    </>
  );
}
