import type { AvatarComponent } from "@rainbow-me/rainbowkit";

export const CustomAvatar: AvatarComponent = ({ size }) => {
  return (
    <img
      src="/assets/goose-avatar.svg"
      alt="Duck Avatar"
      width={size}
      height={size}
      style={{
        borderRadius: "50%",
        objectFit: "cover",
      }}
    />
  );
};
