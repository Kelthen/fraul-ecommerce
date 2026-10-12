import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBrand, getBrands } from "@/lib/catalog";
import { WalkExperience } from "@/walk/WalkExperience";
import { getWalkData } from "@/walk/data";

export async function generateStaticParams() {
  return (await getBrands()).map((b) => ({ marque: b.slug }));
}

export async function generateMetadata({ params }: PageProps<"/walk/[marque]">): Promise<Metadata> {
  const brand = await getBrand((await params).marque);
  return brand
    ? { title: `Boutique ${brand.name} — Fraul Walk`, alternates: { canonical: `/marques/${brand.slug}` } }
    : {};
}

export default async function WalkBrandPage({ params }: PageProps<"/walk/[marque]">) {
  const { marque } = await params;
  const brand = await getBrand(marque);
  if (!brand) notFound();
  const data = await getWalkData();
  return <WalkExperience data={data} startBrand={brand.slug} />;
}
