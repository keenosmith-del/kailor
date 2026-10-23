import {
  BrainCircuit,
  Cloud,
  Code2,
  Workflow,
  Compass,
  Database,
  Network,
  Layers3,
  ChartNoAxesCombined,
  Blocks,
  SearchCheck,
  MessageSquareText,
  type LucideIcon,
} from "lucide-react";

type MarqueeItem = {
  name: string;
  icon?: LucideIcon;
  logo?: string;
  technology?: boolean;
};

export const marqueeItems: MarqueeItem[] = [
  { name: "Technology consulting", icon: Compass },
  { name: "Software engineering", icon: Code2 },
  { name: "Artificial intelligence", icon: BrainCircuit },
  { name: "Business automation", icon: Workflow },
  { name: "Cloud infrastructure", icon: Cloud },
  { name: "System integrations", icon: Network },
  { name: "Data & analytics", icon: ChartNoAxesCombined },
  { name: "Digital platforms", icon: Layers3 },
  { name: "Data engineering", icon: Database },
  { name: "Solution architecture", icon: Blocks },
  { name: "Discovery & analysis", icon: SearchCheck },
  { name: "Client collaboration", icon: MessageSquareText },
  // Languages and frameworks
  {
    name: "React",
    logo: "/technology/react.svg",
    technology: true,
  },
  {
    name: "TypeScript",
    logo: "/technology/typescript.svg",
    technology: true,
  },
  {
    name: "JavaScript",
    logo: "/technology/javascript.svg",
    technology: true,
  },
  {
    name: "Python",
    logo: "/technology/python.svg",
    technology: true,
  },

  { name: "Angular", logo: "/technology/angular.svg", technology: true },
  { name: "Flutter", logo: "/technology/flutter.svg", technology: true },
  { name: "Spring Boot", logo: "/technology/springboot.svg", technology: true },

  // Artificial intelligence
  {
    name: "Claude",
    logo: "/technology/claude.svg",
    technology: true,
  },
  {
    name: "Anthropic",
    logo: "/technology/anthropic.svg",
    technology: true,
  },
  {
    name: "Claude Code",
    logo: "/technology/claudecode.svg",
    technology: true,
  },
  {
    name: "DeepSeek",
    logo: "/technology/deepseek.svg",
    technology: true,
  },
  {
    name: "Google Gemini",
    logo: "/technology/googlegemini.svg",
    technology: true,
  },
  {
    name: "Hugging Face",
    logo: "/technology/huggingface.svg",
    technology: true,
  },
  {
    name: "Ollama",
    logo: "/technology/ollama.svg",
    technology: true,
  },

  // Automation and APIs
  {
    name: "n8n",
    logo: "/technology/n8n.svg",
    technology: true,
  },
  {
    name: "Postman",
    logo: "/technology/postman.svg",
    technology: true,
  },
  {
    name: "JSON Web Tokens",
    logo: "/technology/jsonwebtokens.svg",
    technology: true,
  },

  { name: "Grunt", logo: "/technology/grunt.svg", technology: true },
  { name: "Gulp", logo: "/technology/gulp.svg", technology: true },

  // Databases
  {
    name: "PostgreSQL",
    logo: "/technology/postgresql.svg",
    technology: true,
  },
  { name: "MongoDB", logo: "/technology/mongodb.svg", technology: true },
  { name: "Mongoose", logo: "/technology/mongoose.svg", technology: true },
  {
    name: "SQLite",
    logo: "/technology/sqlite.svg",
    technology: true,
  },

  // Messaging and version control
  {
    name: "Apache Kafka",
    logo: "/technology/apachekafka.svg",
    technology: true,
  },
  { name: "RabbitMQ", logo: "/technology/rabbitmq.svg", technology: true },
  { name: "Git", logo: "/technology/git.svg", technology: true },
  { name: "GitHub", logo: "/technology/github.svg", technology: true },

  // Cloud and deployment
  {
    name: "Google Cloud",
    logo: "/technology/googlecloud.svg",
    technology: true,
  },
  {
    name: "Render",
    logo: "/technology/render.svg",
    technology: true,
  },
  {
    name: "Vercel",
    logo: "/technology/vercel.svg",
    technology: true,
  },
  {
    name: "Azure",
    logo: "/technology/azure.svg",
    technology: true,
  },
];

export const technologyItems = marqueeItems.filter((item) => item.technology);
