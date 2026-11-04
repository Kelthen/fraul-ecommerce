import { ImageResponse } from "next/og";

// Image de partage par défaut (WhatsApp, iMessage, réseaux). À revoir avec le logo TakeUrClothes.
export const alt = "TakeUrClothes, le mall streetwear et luxe";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 90, background: "#680209", color: "#FFFEF7" }}>
      <div style={{ fontSize: 104, fontWeight: 700, letterSpacing: -2 }}>TakeUrClothes</div>
      <div style={{ fontSize: 40, marginTop: 24, color: "#EAE0C8" }}>Le mall streetwear et luxe</div>
    </div>,
    size,
  );
}
