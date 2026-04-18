import { ImageResponse } from "next/og";

export const contentType = "image/png";
export const size = {
  width: 512,
  height: 512,
};

export default function Icon() {
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
        fontSize: 176,
        fontWeight: 700,
        fontFamily: "Arial",
        borderRadius: 96,
        letterSpacing: -8,
      }}
    >
      PB
    </div>,
    size,
  );
}
