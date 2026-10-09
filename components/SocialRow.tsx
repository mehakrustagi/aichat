import Image from "next/image";

/** Apple / Google / email / QR shortcuts (Figma 458:27277). */
const OPTIONS = [
  { key: "apple", label: "Continue with Apple", src: "/icons/apple.png", w: 14.647, h: 18 },
  { key: "google", label: "Continue with Google", src: "/icons/google.png", w: 17.419, h: 18 },
  { key: "email", label: "Continue with email", src: "/icons/alternate-email.svg", w: 18, h: 18 },
  { key: "qr", label: "Scan QR code", src: "/icons/qr-code-scanner.svg", w: 18, h: 18 },
] as const;

export function SocialRow() {
  return (
    <div className="flex w-full items-center justify-between">
      {OPTIONS.map((o) => (
        <button
          key={o.key}
          type="button"
          aria-label={o.label}
          className="flex h-[40px] w-[75px] items-center justify-center rounded-[15px] border border-solid border-[#d6d9dc] bg-white"
        >
          <Image
            src={o.src}
            alt=""
            width={o.w}
            height={o.h}
            style={{ width: o.w, height: o.h }}
          />
        </button>
      ))}
    </div>
  );
}
