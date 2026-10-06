import type { Testimonial } from "@/components/ui/testimonial-card";

type FeaturedTestimonial = Testimonial & { highlight: string };

// Illustrative copy and fictional identities for the landing-page design.
// Replace with permissioned student reviews before presenting these as endorsements.
export const sampleReviews: FeaturedTestimonial[] = [
  {
    name: "Maya Chen",
    role: "Frontend developer",
    image: "/images/community/maya.jpg",
    subject: "From following along to figuring it out",
    quote:
      "I used to finish tutorials with a working app and no idea why it worked. These lessons gave me the space to slow down, connect the dots, and finally make the code my own.",
    highlight: "The moment it finally clicked.",
  },
  {
    name: "Daniel Brooks",
    role: "Full-stack developer",
    image: "/images/community/daniel.jpg",
    subject: "A little learning, every day",
    quote:
      "One lesson over coffee, one idea to try at work. Learning finally fits around my day instead of taking it over.",
    highlight: "Small lessons. A bigger perspective.",
  },
  {
    name: "Amara Okafor",
    role: "Software engineer",
    image: "/images/community/amara.jpg",
    subject: "Understanding the why",
    quote:
      "The little explanations between the code are what make the difference. I’m thinking through trade-offs now, instead of just reaching for the first solution.",
    highlight: "More intention in every line of code.",
  },
  {
    name: "Leo Martins",
    role: "Independent developer",
    image: "/images/community/leo.jpg",
    subject: "Less noise, more focus",
    quote:
      "No twenty-tab rabbit hole. Just a clear next step, room to experiment, and a learning space that gets out of the way.",
    highlight: "A calmer way to keep getting better.",
  },
  {
    name: "Nina Patel",
    role: "React developer",
    image: "/images/community/nina.jpg",
    subject: "Building with confidence",
    quote:
      "I came back to a tricky lesson three times. On the fourth, it clicked. Being able to go at my own pace made all the difference.",
    highlight: "My pace. My breakthrough.",
  },
  {
    name: "James Carter",
    role: "Backend developer",
    image: "/images/community/james.jpg",
    subject: "Ideas that leave the tutorial",
    quote:
      "The best part is closing the lesson and actually using what I learned. That’s the kind of progress I was looking for.",
    highlight: "Knowledge I can put to work.",
  },
  {
    name: "Sara Haddad",
    role: "Product engineer",
    image: "/images/community/sara.jpg",
    subject: "Finding my way back",
    quote:
      "A busy week used to mean starting over. Now I pick up exactly where I left off. It’s a small detail that keeps me coming back.",
    highlight: "A little momentum goes a long way.",
  },
  {
    name: "Elliot Reed",
    role: "Creative developer",
    image: "/images/community/elliot.jpg",
    subject: "Making room for curiosity",
    quote:
      "I started with a question and ended up with a side project. Sometimes all you need is a good explanation and a little nudge to try.",
    highlight: "One question. A whole new direction.",
  },
];
