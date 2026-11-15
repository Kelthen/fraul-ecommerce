import { logoColors } from "@/models/admin/boutique";

const LOGO_PX = 512;

/** Réduit un logo en PNG (la transparence reste) et lit ses couleurs, dans le navigateur. */
export async function readLogo(file: File): Promise<{ png: File; color: string; textColor: string }> {
  const img = await createImageBitmap(file);
  const scale = Math.min(1, LOGO_PX / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(img.width * scale));
  c.height = Math.max(1, Math.round(img.height * scale));
  const x = c.getContext("2d")!;
  x.drawImage(img, 0, 0, c.width, c.height);
  const colors = logoColors(x.getImageData(0, 0, c.width, c.height).data);
  const blob = await new Promise<Blob>((ok, ko) => c.toBlob((b) => (b ? ok(b) : ko(new Error("logo illisible"))), "image/png"));
  return { png: new File([blob], "logo.png", { type: "image/png" }), ...colors };
}
