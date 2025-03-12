import React from "react";
import { MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";

interface RenderIconProps {
  icon: string;
  type?: string;
  size: number;
  color: string;
  style?: object;
}

export const RenderIcon: React.FC<RenderIconProps> = ({
  icon,
  type,
  size,
  color,
  style,
}) => {
  const isCustomIcon =
    icon.includes("-alt") ||
    icon === "shopping-basket" ||
    icon === "glass-martini-alt";

  if (isCustomIcon || type === "font-awesome") {
    return (
      <FontAwesome5
        name={icon.replace("-alt", "")}
        size={size}
        color={color}
        style={style}
      />
    );
  }

  return (
    <MaterialCommunityIcons name={icon} size={size} color={color} style={style} />
  );
};