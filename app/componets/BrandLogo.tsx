import Image from "next/image";

type BrandLogoProps = {
  size?: "small" | "medium" | "large";
};

const sizes = {
  small: { frame: "h-9 w-9", image: "h-[102px] w-[102px]" },
  medium: { frame: "h-12 w-12", image: "h-[136px] w-[136px]" },
  large: { frame: "h-20 w-20", image: "h-[228px] w-[228px]" },
};

export default function BrandLogo({ size = "medium" }: BrandLogoProps) {
  const { frame, image } = sizes[size];

  return (
    <span className={`relative block shrink-0 overflow-hidden rounded-xl bg-white ${frame}`}>
      <Image
        src="/bjot-logo.png"
        alt="BJOT logo"
        width={1181}
        height={1181}
        className={`absolute left-1/2 top-1/2 max-w-none -translate-x-1/2 -translate-y-1/2 ${image}`}
        priority={size === "large"}
      />
    </span>
  );
}
