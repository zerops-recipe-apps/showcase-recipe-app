import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Boxes, ShieldCheck } from "lucide-react";
import { SERVICES, ServiceCard, CodeBlock, type CodeLine } from "./primitives";

export interface GuideStep {
  /** Short tag shown above the title. */
  eyebrow: string;
  title: string;
  /** One or two short paragraphs. */
  body: ReactNode;
  /** Right-hand illustration. */
  visual: ReactNode;
}

// ---- Visuals -------------------------------------------------------------

function ServiceGrid({ filter }: { filter?: "managed" | "runtime" }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {SERVICES.map((s) => (
        <motion.div
          key={s.host}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <ServiceCard
            service={s}
            dimmed={filter === "managed" ? !s.managed : filter === "runtime" ? s.managed : false}
            badge={
              filter === "managed" && s.managed
                ? "managed"
                : filter === "runtime" && !s.managed
                ? "your code"
                : undefined
            }
          />
        </motion.div>
      ))}
    </div>
  );
}

function ProjectVisual() {
  return (
    <div className="rounded-2xl border border-dashed border-teal-300 bg-teal-50/40 p-4">
      <div className="mb-3 flex items-center gap-2 text-teal-700">
        <Boxes size={16} />
        <span className="text-xs font-medium">Project — one private network</span>
      </div>
      <ServiceGrid />
    </div>
  );
}

function ConnectionVisual() {
  const links = [
    { ref: "${db_hostname}", into: "DB_HOST", host: "db" },
    { ref: "${redis_password}", into: "REDIS_PASSWORD", host: "redis" },
    { ref: "${queue_hostname}", into: "NATS_HOST", host: "queue" },
    { ref: "${storage_apiUrl}", into: "S3_ENDPOINT", host: "storage" },
  ];
  return (
    <div className="space-y-2.5">
      {links.map((l, i) => (
        <motion.div
          key={l.into}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.08 * i, duration: 0.25 }}
          className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 shadow-sm"
        >
          <code className="font-mono text-[11px] text-sky-700">{l.into}</code>
          <span className="font-mono text-[12px] text-zinc-400">=</span>
          <code className="rounded bg-amber-50 px-2 py-1 font-mono text-[11px] text-amber-700">
            {l.ref}
          </code>
          <span className="ml-auto font-mono text-[10px] text-zinc-400">from “{l.host}”</span>
        </motion.div>
      ))}
    </div>
  );
}

const YAML_LINES: CodeLine[] = [
  { text: "zerops:", tone: "key" },
  { text: "  - setup: prod", tone: "section" },
  { text: "    build:                       # how to compile", highlight: true },
  { text: "      base: bun@1.2", highlight: true },
  { text: "      buildCommands:", highlight: true },
  { text: "        - bun install", highlight: true },
  { text: "        - bun build src/index.ts", highlight: true },
  { text: "    deploy:                      # what ships" },
  { text: "      deployFiles: [ ./dist ]" },
  { text: "    run:                         # how it runs" },
  { text: "      base: bun@1.2" },
  { text: "      ports:" },
  { text: "        - port: 3000" },
  { text: "          httpSupport: true" },
  { text: "      start: bun run dist/index.js" },
];

function CoreVisual() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-teal-200 bg-teal-50 p-3">
        <div className="flex items-center gap-2 text-teal-700">
          <ShieldCheck size={16} />
          <span className="text-xs font-semibold">Project Core</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {["L3 routing", "L7 HTTP balancer", "firewall", "logs", "metrics"].map((p) => (
            <span
              key={p}
              className="rounded border border-teal-100 bg-white px-2 py-0.5 font-mono text-[10px] text-teal-600"
            >
              {p}
            </span>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-3">
          <div className="text-xs font-semibold text-zinc-700">Lightweight</div>
          <div className="mt-1 text-[11px] text-zinc-500">Shared core. Cheapest — great for dev & demos.</div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-3">
          <div className="text-xs font-semibold text-zinc-700">Serious</div>
          <div className="mt-1 text-[11px] text-zinc-500">Dedicated, HA core for production traffic.</div>
        </div>
      </div>
    </div>
  );
}

function FlowVisual() {
  const steps = [
    { label: "Upload", host: "app" },
    { label: "Store + queue", host: "db · storage · queue" },
    { label: "Process", host: "worker" },
    { label: "Live update", host: "app · ws" },
  ];
  return (
    <div className="space-y-2.5">
      {steps.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 * i, duration: 0.25 }}
          className="flex items-center gap-3"
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-900 font-mono text-[11px] text-white">
            {i + 1}
          </div>
          <div className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 shadow-sm">
            <div className="text-sm font-medium text-zinc-800">{s.label}</div>
            <code className="font-mono text-[10px] text-zinc-400">{s.host}</code>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ---- Steps ---------------------------------------------------------------

export const STEPS: GuideStep[] = [
  {
    eyebrow: "What is Zerops",
    title: "Run apps without running infrastructure",
    body: (
      <>
        <p>
          Zerops is a developer-first platform. You describe your app — Zerops provisions,
          connects, and operates the infrastructure for you.
        </p>
        <p className="mt-3 text-zinc-500">
          This very app runs entirely on Zerops. Let’s walk through how it’s built — then
          you’ll watch it work live.
        </p>
      </>
    ),
    visual: (
      <div className="flex h-full items-center justify-center">
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
          <Boxes className="mx-auto text-teal-500" size={48} />
          <div className="mt-4 text-lg font-semibold text-zinc-800">A full image pipeline</div>
          <div className="mt-1 text-sm text-zinc-500">2 runtimes · 4 managed services</div>
        </div>
      </div>
    ),
  },
  {
    eyebrow: "Building blocks",
    title: "A project is a network of services",
    body: (
      <>
        <p>
          Everything in Zerops is a <strong>service</strong>. A <strong>project</strong> groups
          them into one private network where they can reach each other directly.
        </p>
        <p className="mt-3 text-zinc-500">
          This project has six services — your own code and the data layer it depends on.
        </p>
      </>
    ),
    visual: <ProjectVisual />,
  },
  {
    eyebrow: "No ops required",
    title: "Databases & brokers, fully managed",
    body: (
      <>
        <p>
          You don’t install or babysit PostgreSQL, Valkey, NATS, or object storage. You add them
          as services and Zerops runs them.
        </p>
        <p className="mt-3 text-zinc-500">
          Backups, high-availability, and scaling are toggles — not weekend projects.
        </p>
      </>
    ),
    visual: <ServiceGrid filter="managed" />,
  },
  {
    eyebrow: "Wiring",
    title: "Services connect by hostname",
    body: (
      <>
        <p>
          Inside a project, services talk over a private network using their{" "}
          <strong>hostname</strong>. Zerops injects each service’s connection details as
          environment variables.
        </p>
        <p className="mt-3 text-zinc-500">
          Reference another service with{" "}
          <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[12px] text-amber-700">
            ${"{hostname_variable}"}
          </code>{" "}
          — no IPs, no secrets in your repo.
        </p>
      </>
    ),
    visual: <ConnectionVisual />,
  },
  {
    eyebrow: "Configuration",
    title: "One file: build, deploy, run",
    body: (
      <>
        <p>
          A single <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[12px]">zerops.yaml</code>{" "}
          at your repo root describes the three phases: how to <strong>build</strong>, what to{" "}
          <strong>deploy</strong>, and how to <strong>run</strong>.
        </p>
        <p className="mt-3 text-zinc-500">
          Define several setups — e.g. a <code className="font-mono text-[12px]">prod</code> bundle
          and a <code className="font-mono text-[12px]">dev</code> hot-reload mode — in the same file.
        </p>
      </>
    ),
    visual: <CodeBlock lines={YAML_LINES} />,
  },
  {
    eyebrow: "The platform layer",
    title: "Routing & networking, automatic",
    body: (
      <>
        <p>
          Every project gets a <strong>Core</strong>: L3/L7 balancing, firewall, internal routing,
          logs, and metrics — without you configuring any of it.
        </p>
        <p className="mt-3 text-zinc-500">
          Pick a lightweight shared core for dev, or a dedicated HA core for production. The live
          diagram in the demo reflects whichever mode this project runs.
        </p>
      </>
    ),
    visual: <CoreVisual />,
  },
  {
    eyebrow: "See it live",
    title: "Watch the architecture in action",
    body: (
      <>
        <p>
          You now know the pieces. The live demo shows this exact project working: upload an image
          and watch it flow across every service in real time.
        </p>
        <p className="mt-3 text-zinc-500">
          The API stores it in object storage, records metadata in PostgreSQL, and queues a job on
          NATS. The Python worker processes it and streams updates back over WebSocket.
        </p>
      </>
    ),
    visual: <FlowVisual />,
  },
];
