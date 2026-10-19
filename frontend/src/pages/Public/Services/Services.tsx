import { ServicesHero } from "./ServicesHero/ServicesHero";
import { ServiceIndex } from "./ServiceIndex/ServiceIndex";
import { ServiceDetails } from "./ServiceDetails/ServiceDetails";
import { ServicesClosing } from "./ServicesClosing/ServicesClosing";
import "./Services.css";
export default function Services() {
  return (
    <>
      <ServicesHero />
      <ServiceIndex />
      <ServiceDetails />
      <ServicesClosing />
    </>
  );
}
