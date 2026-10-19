import { AboutHero } from "./AboutHero/AboutHero";
import { Statement } from "./Statement/Statement";
import { Principles } from "./Principles/Principles";
import { Founder } from "./Founder/Founder";
import "./About.css";
export default function About() {
  return (
    <>
      <AboutHero />
      <Statement />
      <Principles />
      <Founder />
    </>
  );
}
