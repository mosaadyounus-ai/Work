import { guardianPalette } from "./omegaDossier";

export type CodexGuardianName =
  | "Lion"
  | "Phoenix"
  | "Dragon"
  | "Raven"
  | "Butterfly";

export type CodexGuardianFilter = CodexGuardianName | "All";

export interface CodexHexagram {
  code: string;
  guardian: CodexGuardianName;
  span: string;
  angelu: number;
  deminu: number;
  neutral: number;
  polarity: string;
  pathList: string[];
}

export interface CodexGuardianSector {
  guardian: CodexGuardianName;
  title: string;
  color: string;
  range: string;
  center: string;
  hexagramCount: number;
  pathCount: number;
  angelu: number;
  deminu: number;
  neutral: number;
  net: number;
}

const guardianMeta: Record<
  CodexGuardianName,
  { title: string; range: string; center: string }
> = {
  Lion: {
    title: "Sovereign",
    range: "0 to 67.5 deg",
    center: "33.75 deg",
  },
  Phoenix: {
    title: "Rebirth",
    range: "72 to 139.5 deg",
    center: "105.75 deg",
  },
  Dragon: {
    title: "Wisdom",
    range: "144 to 211.5 deg",
    center: "177.75 deg",
  },
  Raven: {
    title: "Passage",
    range: "216 to 283.5 deg",
    center: "249.75 deg",
  },
  Butterfly: {
    title: "Metamorph",
    range: "288 to 355.5 deg",
    center: "321.75 deg",
  },
};

export const codexHexagrams: CodexHexagram[] = [
  {
    code: "I",
    guardian: "Lion",
    span: "0 to 16.875 deg",
    angelu: 4,
    deminu: 1,
    neutral: 1,
    polarity: "Angelu dominant",
    pathList: ["Crown", "Throne", "Herald", "Aegis", "Vanguard", "Standard"],
  },
  {
    code: "II",
    guardian: "Lion",
    span: "22.5 to 39.375 deg",
    angelu: 3,
    deminu: 2,
    neutral: 1,
    polarity: "Angelu leaning",
    pathList: ["Bastion", "Mandate", "Forge", "Sentinel", "Warden", "Valor"],
  },
  {
    code: "III",
    guardian: "Lion",
    span: "45 to 61.875 deg",
    angelu: 2,
    deminu: 1,
    neutral: 3,
    polarity: "Balanced crown",
    pathList: ["Dominion", "Rampart", "Apex", "Sovereign", "Garrison", "Tribute"],
  },
  {
    code: "IV",
    guardian: "Phoenix",
    span: "72 to 88.875 deg",
    angelu: 2,
    deminu: 3,
    neutral: 1,
    polarity: "Deminu leaning",
    pathList: ["Vigilance", "Ember", "Pyre", "Cinder", "Kindle", "Crucible"],
  },
  {
    code: "V",
    guardian: "Phoenix",
    span: "94.5 to 111.375 deg",
    angelu: 4,
    deminu: 1,
    neutral: 1,
    polarity: "Angelu dominant",
    pathList: ["Flare", "Solstice", "Radiance", "Ignition", "Aurora", "Catalyst"],
  },
  {
    code: "VI",
    guardian: "Phoenix",
    span: "117 to 133.875 deg",
    angelu: 3,
    deminu: 1,
    neutral: 2,
    polarity: "Angelu leaning",
    pathList: ["Phoenix", "Ascent", "Rebirth", "Surge", "Kindling", "Halo"],
  },
  {
    code: "VII",
    guardian: "Dragon",
    span: "144 to 160.875 deg",
    angelu: 1,
    deminu: 3,
    neutral: 2,
    polarity: "Deminu dominant",
    pathList: ["Scale", "Fang", "Coil", "Wing", "Breath", "Crown"],
  },
  {
    code: "VIII",
    guardian: "Dragon",
    span: "166.5 to 183.375 deg",
    angelu: 2,
    deminu: 2,
    neutral: 2,
    polarity: "Balanced",
    pathList: ["Serpent", "Wyrm", "Talon", "Ridge", "Crest", "Spine"],
  },
  {
    code: "IX",
    guardian: "Dragon",
    span: "189 to 205.875 deg",
    angelu: 1,
    deminu: 4,
    neutral: 1,
    polarity: "Deminu dominant",
    pathList: ["Maw", "Void", "Shadow", "Dusk", "Eclipse", "Obsidian"],
  },
  {
    code: "X",
    guardian: "Raven",
    span: "216 to 232.875 deg",
    angelu: 2,
    deminu: 1,
    neutral: 3,
    polarity: "Balanced watch",
    pathList: ["Sight", "Vigil", "Watch", "Witness", "Eye", "Lens"],
  },
  {
    code: "XI",
    guardian: "Raven",
    span: "238.5 to 255.375 deg",
    angelu: 3,
    deminu: 1,
    neutral: 2,
    polarity: "Angelu leaning",
    pathList: ["Clarity", "Insight", "Truth", "Mirror", "Veil", "Glass"],
  },
  {
    code: "XII",
    guardian: "Raven",
    span: "261 to 277.875 deg",
    angelu: 1,
    deminu: 2,
    neutral: 3,
    polarity: "Night watch",
    pathList: ["Dark", "Blind", "Maze", "Fog", "Shroud", "Mist"],
  },
  {
    code: "XIII",
    guardian: "Butterfly",
    span: "288 to 304.875 deg",
    angelu: 1,
    deminu: 3,
    neutral: 2,
    polarity: "Deminu leaning",
    pathList: ["Wing", "Chrysalis", "Pulse", "Shift", "Echo", "Signal"],
  },
  {
    code: "XIV",
    guardian: "Butterfly",
    span: "310.5 to 327.375 deg",
    angelu: 2,
    deminu: 2,
    neutral: 2,
    polarity: "Balanced weave",
    pathList: ["Bloom", "Thread", "Prism", "Silk", "Drift", "Gleam"],
  },
  {
    code: "XV",
    guardian: "Butterfly",
    span: "333 to 349.875 deg",
    angelu: 1,
    deminu: 2,
    neutral: 3,
    polarity: "Deminu leaning",
    pathList: ["Veil", "Petal", "Spiral", "Halo", "Afterimage", "Quiet"],
  },
  {
    code: "XVI",
    guardian: "Lion",
    span: "354 to 11.25 deg",
    angelu: 2,
    deminu: 0,
    neutral: 4,
    polarity: "Threshold return",
    pathList: ["Threshold", "Gate", "Portal", "Return", "Cycle", "Crown"],
  },
];

export const codexGuardianSectors: CodexGuardianSector[] = (
  Object.keys(guardianMeta) as CodexGuardianName[]
).map((guardian) => {
  const slices = codexHexagrams.filter((hexagram) => hexagram.guardian === guardian);
  const angelu = slices.reduce((sum, hexagram) => sum + hexagram.angelu, 0);
  const deminu = slices.reduce((sum, hexagram) => sum + hexagram.deminu, 0);
  const neutral = slices.reduce((sum, hexagram) => sum + hexagram.neutral, 0);

  return {
    guardian,
    title: guardianMeta[guardian].title,
    color: guardianPalette[guardian],
    range: guardianMeta[guardian].range,
    center: guardianMeta[guardian].center,
    hexagramCount: slices.length,
    pathCount: angelu + deminu + neutral,
    angelu,
    deminu,
    neutral,
    net: angelu - deminu,
  };
});

export const codexPolarityTotals = codexGuardianSectors.reduce(
  (totals, sector) => ({
    pathCount: totals.pathCount + sector.pathCount,
    angelu: totals.angelu + sector.angelu,
    deminu: totals.deminu + sector.deminu,
    neutral: totals.neutral + sector.neutral,
  }),
  {
    pathCount: 0,
    angelu: 0,
    deminu: 0,
    neutral: 0,
  },
);

export const latticeDecisionLoop = [
  "Invocation",
  "Resonance",
  "Deliberation",
  "Convergence",
  "Seal",
];
