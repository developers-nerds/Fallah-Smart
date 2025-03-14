import React from "react";
import { MaterialCommunityIcons, FontAwesome5, MaterialIcons } from "@expo/vector-icons";

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

  // Handle MaterialIcons for type="material"
  if (type === "material") {
    return (
      <MaterialIcons name={icon} size={size} color={color} style={style} />
    );
  }

  // Handle FontAwesome5 for custom icons or type="font-awesome"
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

  // Default to MaterialCommunityIcons
  return (
    <MaterialCommunityIcons name={icon} size={size} color={color} style={style} />
  );
};