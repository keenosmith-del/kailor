// Compatibility with a local Home.tsx that already imports <Testimonials />.
// The committed GitHub homepage uses <ClientFeedback /> instead.
export { ClientFeedback as Testimonials } from "../ClientFeedback/ClientFeedback";
