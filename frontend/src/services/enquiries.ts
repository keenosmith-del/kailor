import emailjs from "@emailjs/browser";
export const CONTACT_EMAIL = "keenosmith@kailor.co.za";
export const ENQUIRY_LIMITS = { name: 100, email: 254, message: 3000 } as const;
export const ENQUIRY_TOPICS = [
  "I have a project in mind",
  "I need technical advice",
  "I'm exploring AI or automation",
  "Something else",
] as const;
export type EnquiryTopic = (typeof ENQUIRY_TOPICS)[number];
export type EnquiryField = "name" | "email" | "message";
export type EnquiryFields = Record<EnquiryField, string>;
export type EnquiryErrors = Partial<Record<EnquiryField, string>>;
export const emptyEnquiry: EnquiryFields = { name: "", email: "", message: "" };
export const ENQUIRY_FAILURE = `Your message couldn't be sent. Please email ${CONTACT_EMAIL}.`;
export function validateEnquiry(fields: EnquiryFields): EnquiryErrors {
  const errors: EnquiryErrors = {};
  if (!fields.name.trim()) errors.name = "Please enter your name.";
  else if (fields.name.trim().length > ENQUIRY_LIMITS.name)
    errors.name = "Please use a shorter name.";
  if (!fields.email.trim()) errors.email = "Please enter your email address.";
  else if (
    fields.email.trim().length > ENQUIRY_LIMITS.email ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())
  )
    errors.email = "Enter a valid email address.";
  if (!fields.message.trim()) errors.message = "Please enter a message.";
  else if (fields.message.trim().length < 10)
    errors.message = "Please add a little more detail.";
  else if (fields.message.trim().length > ENQUIRY_LIMITS.message)
    errors.message = "Please keep your message within 3,000 characters.";
  return errors;
}
export async function sendEnquiry(
  fields: EnquiryFields,
  topic: EnquiryTopic | "" = "",
): Promise<void> {
  if (
    Object.keys(validateEnquiry(fields)).length ||
    (topic && !ENQUIRY_TOPICS.includes(topic))
  )
    throw new Error(ENQUIRY_FAILURE);
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
  if (!serviceId || !templateId || !publicKey) throw new Error(ENQUIRY_FAILURE);
  try {
    const receipt = await emailjs.send(
      serviceId,
      templateId,
      {
        from_name: fields.name.trim(),
        reply_to: fields.email.trim(),
        subject: topic ? `Website enquiry — ${topic}` : "Website enquiry",
        message: fields.message.trim(),
      },
      { publicKey },
    );
    if (
      !Number.isInteger(receipt?.status) ||
      receipt.status < 200 ||
      receipt.status >= 300
    )
      throw new Error("Delivery not confirmed");
  } catch {
    throw new Error(ENQUIRY_FAILURE);
  }
}
