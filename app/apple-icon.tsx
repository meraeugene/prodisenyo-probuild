import { ImageResponse } from "next/og";

export const contentType = "image/png";
export const size = {
  width: 180,
  height: 180,
};

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, rgb(17, 46, 26) 0%, rgb(31, 79, 44) 45%, rgb(36, 95, 52) 100%)",
        color: "white",
        fontSize: 72,
        fontWeight: 700,
        fontFamily: "Arial",
        borderRadius: 36,
        letterSpacing: -3,
      }}
    >
      PB
    </div>,
    size,
  );
}
