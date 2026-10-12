import type { Metadata } from "next";
import { WalkExperience } from "@/walk/WalkExperience";
import { getWalkData } from "@/walk/data";

export const metadata: Metadata = {
  title: "Fraul Walk — le mall",
  description: "Promène-toi devant les vitrines, entre dans la boutique d'une marque et regarde les pièces sortir du rayon.",
};

export default async function WalkPage() {
  const data = await getWalkData();
  return <WalkExperience data={data} />;
}
