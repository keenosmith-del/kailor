import { ContactHero } from "./ContactHero/ContactHero";
import { DirectContact } from "./DirectContact/DirectContact";
import { ContactLinks } from "./ContactLinks/ContactLinks";
import "./Contact.css";
export default function Contact() {
  return (
    <>
      <ContactHero />
      <DirectContact />
      <ContactLinks />
    </>
  );
}
