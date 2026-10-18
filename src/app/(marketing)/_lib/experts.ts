// Expert:innen-Netzwerk für die Startseite. Quelle: Sheet "Ai Profis - Central",
// Blatt "Berater". Öffentlich nur Vorname + Initial des Nachnamens, Land und
// Schwerpunkt — keine Kontaktdaten, Websites, Stundensätze, Arbeitgeber oder
// Kundennamen. Neue Profile hier im selben Format ergänzen.

export type Country = "AT" | "DE" | "CH";

// Angebotsblöcke der Startseite (dict.expert_home.stack.groups[].area).
export type Area = "consulting" | "agents" | "automation" | "ml" | "cloud";

export type Expert = {
  name: string;
  areas: Area[];
  country: Country;
  focus: { de: string; en: string };
  tags: string[];
};

export const EXPERTS: Expert[] = [
  { name: "Martin M.", areas: ["consulting"], country: "AT", focus: { de: "KI-Strategie für Unternehmen", en: "AI strategy for companies" }, tags: ["Strategie"] },
  { name: "Christa S.", areas: ["automation", "consulting"], country: "DE", focus: { de: "KI-Wandel & Prozessautomatisierung", en: "AI transformation & process automation" }, tags: ["UiPath", "Transformation"] },
  { name: "Harald F.", areas: ["consulting"], country: "DE", focus: { de: "Eigene Apps mit KI – ohne Programmierkenntnisse", en: "Building apps with AI – no coding required" }, tags: ["No-Code", "Training"] },
  { name: "Daniel L.", areas: ["agents", "ml", "automation", "consulting"], country: "AT", focus: { de: "Digital-Twin-Plattformen, ML & KI-Agenten", en: "Digital twin platforms, ML & AI agents" }, tags: ["PyTorch", "LangGraph", "n8n"] },
  { name: "Gregor L.", areas: ["consulting"], country: "AT", focus: { de: "Industrielle KI in Automotive & Fertigung", en: "Industrial AI in automotive & manufacturing" }, tags: ["Interim AI Manager", "Speaker"] },
  { name: "Nemanja K.", areas: ["agents", "consulting"], country: "AT", focus: { de: "KI-Agenten & KI-Strategie", en: "AI agents & AI strategy" }, tags: ["LangGraph", "CrewAI", "Python"] },
  { name: "Raphael F.", areas: ["ml", "agents"], country: "AT", focus: { de: "ML-Engineering & KI-Agenten", en: "ML engineering & AI agents" }, tags: ["PyTorch", "LlamaIndex", "Hugging Face"] },
  { name: "Lukas H.", areas: ["agents", "automation", "consulting"], country: "CH", focus: { de: "Prompt Engineering & KI-Agenten", en: "Prompt engineering & AI agents" }, tags: ["LangGraph", "Make", "Strategie"] },
  { name: "Viktor L.", areas: ["ml", "cloud", "agents"], country: "AT", focus: { de: "Machine Learning & Data Science", en: "Machine learning & data science" }, tags: ["PyTorch", "SageMaker", "Python"] },
  { name: "Dominik W.", areas: ["ml", "automation"], country: "AT", focus: { de: "Data Analytics, ML & Automatisierung", en: "Data analytics, ML & automation" }, tags: ["Python", "TensorFlow", "n8n"] },
  { name: "Nicolas Z.", areas: ["agents", "ml", "cloud"], country: "DE", focus: { de: "LLM-Agenten & Computer Vision (2D/3D)", en: "LLM agents & computer vision (2D/3D)" }, tags: ["Computer Vision", "AWS", "LangGraph"] },
  { name: "Dr.-Ing. Derek M.", areas: ["automation", "agents"], country: "DE", focus: { de: "n8n-Automatisierung, Voice Agents & Self-Hosting", en: "n8n automation, voice agents & self-hosting" }, tags: ["n8n", "Voice Agents", "Supabase"] },
  { name: "Alexander K.", areas: ["agents", "automation"], country: "DE", focus: { de: "Backend & KI-Agenten im produktiven Einsatz", en: "Backend & AI agents in production" }, tags: ["LangGraph", "MCP", "FastAPI"] },
  { name: "Kaan D.", areas: ["ml", "agents"], country: "DE", focus: { de: "Deep Learning & Agenten-Frameworks", en: "Deep learning & agent frameworks" }, tags: ["PyTorch", "CrewAI", "Hugging Face"] },
  { name: "Dieter H.", areas: ["automation", "consulting"], country: "AT", focus: { de: "KI-Schulungen & Automatisierung mit n8n", en: "AI training & automation with n8n" }, tags: ["n8n", "Flowise", "Training"] },
  { name: "Frank G.", areas: ["automation", "consulting"], country: "DE", focus: { de: "Prozessdigitalisierung & self-hosted LLMs", en: "Process digitalisation & self-hosted LLMs" }, tags: ["Kubernetes", "Open-Source-LLMs", "Make"] },
  { name: "Farhan H.", areas: ["automation", "consulting", "cloud"], country: "DE", focus: { de: "RPA & KI-Automatisierung", en: "RPA & AI automation" }, tags: ["Blue Prism", "Agent Builder", "Strategie"] },
  { name: "Roman W.", areas: ["consulting"], country: "DE", focus: { de: "KI-Strategie & AI Product Management", en: "AI strategy & AI product management" }, tags: ["Strategie", "Training", "Speaker"] },
  { name: "Sascha J.", areas: ["automation", "agents"], country: "DE", focus: { de: "KI-Beratung & Automatisierung", en: "AI consulting & automation" }, tags: ["Python", "LangChain", "n8n"] },
  { name: "Robin G.", areas: ["ml"], country: "CH", focus: { de: "Embedded & lokale KI, Sensorik, Bildverarbeitung", en: "Embedded & local AI, sensors, image processing" }, tags: ["Embedded AI", "C/C++", "Edge"] },
  { name: "Ramazan C.", areas: ["consulting"], country: "DE", focus: { de: "AI Governance & KI-Implementierung", en: "AI governance & AI implementation" }, tags: ["AI Act", "AI Officer", "Architektur"] },
  { name: "Rosanna P.", areas: ["consulting"], country: "DE", focus: { de: "KI-Training, Lehre & KI-Beauftragte", en: "AI training, teaching & AI officer" }, tags: ["GenAI", "AI Act", "Training"] },
  { name: "Bengt L.", areas: ["ml", "cloud", "agents"], country: "DE", focus: { de: "Machine Learning, MLOps & Optimierung", en: "Machine learning, MLOps & optimisation" }, tags: ["PyTorch", "MLOps", "RAG"] },
  { name: "Georg M.", areas: ["consulting"], country: "AT", focus: { de: "KI-Strategie & AI Act", en: "AI strategy & AI Act" }, tags: ["Strategie", "AI Act"] },
  { name: "Sabine S.", areas: ["consulting"], country: "AT", focus: { de: "AI Ethics by Design & Value Creation", en: "AI ethics by design & value creation" }, tags: ["Ethik", "Speaker", "Interim AI Manager"] },
  { name: "Thorsten W.", areas: ["consulting"], country: "DE", focus: { de: "KI-Projekte im Banking & Team-Trainings", en: "AI projects in banking & team training" }, tags: ["Banking", "Training", "Speaker"] },
  { name: "Cornelia S.", areas: ["consulting"], country: "AT", focus: { de: "GenAI-Training, KI-Avatare & KI-Video", en: "GenAI training, AI avatars & AI video" }, tags: ["GenAI", "Video", "Vibe Coding"] },
  { name: "Daniel M.", areas: ["agents", "ml", "automation"], country: "DE", focus: { de: "KI-Entwicklung & Agenten", en: "AI engineering & agents" }, tags: ["Python", "LangChain", "Speaker"] },
  { name: "Dr. David F.", areas: ["agents", "consulting"], country: "DE", focus: { de: "KI-Agenten, AI-Coding & Forschungstransfer", en: "AI agents, AI coding & research transfer" }, tags: ["Conversational AI", "AI-Coding", "Strategie"] },
  { name: "Stefan W.", areas: ["automation", "agents"], country: "AT", focus: { de: "Lead-Systeme, Voice Agents & ROI-Modelle", en: "Lead systems, voice agents & ROI models" }, tags: ["Voice Agents", "Outreach", "n8n"] },
];

export function expertSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
