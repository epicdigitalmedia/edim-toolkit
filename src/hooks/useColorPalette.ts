import { useColorMode, useColorModeValue } from "@chakra-ui/react";

const useColorPalette = () => {
  const { colorMode } = useColorMode();

  const bgColorLight = "white";
  const bgColorDark = "gray.700";

  const textColorLight = "gray.700";
  const textColorDark = "gray.500";

  const inputBgColorLight = "white";
  const inputBgColorDark = "#1a202c";
  const inputBorderColor = "#474b54";
  const inputBgColor = useColorModeValue(inputBgColorLight, inputBgColorDark);

  const bgPrevButton = useColorModeValue("gray.100", "gray.100");
  const bgProfile = useColorModeValue(
    "hsla(0,0%,100%,.8)",
    "linear-gradient(112.83deg, rgba(228, 10, 10, 0.21) 0%, rgba(255, 255, 255, 0) 110.84%)"
  );
  const borderProfileColor = useColorModeValue(
    "white",
    "rgba(255, 255, 255, 0.31)"
  );
  const emailColor = useColorModeValue("gray.400", "gray.300");
  const valColor = useColorModeValue("gray.600", "white");

  return {
    colorMode,
    bgColor: useColorModeValue(bgColorLight, bgColorDark),
    bgColorLight,
    bgColorDark,
    textColor: useColorModeValue(textColorLight, textColorDark),
    textColorLight,
    textColorDark,
    bgPrevButton,
    bgProfile,
    borderProfileColor,
    emailColor,
    inputBgColor,
    inputBgColorLight,
    inputBgColorDark,
    inputBorderColor,
    valColor,
  }
}

export default useColorPalette;