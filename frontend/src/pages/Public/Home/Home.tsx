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
import "./Home.css";
export default function Home() {
  return (
    <>
      <Hero />
      <Introduction />
      <ServicesSection />
      <ClientJourneys />
      <Conversation />
      <Process />
      <Intelligence />
      <Insights />
      <SelectedWork />
      <EngagementSection />
      <Closing />
    </>
  );
}
