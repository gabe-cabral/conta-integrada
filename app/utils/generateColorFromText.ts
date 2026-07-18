function hslChannelToHex(value: number): string {
  return Math.round(value * 255)
    .toString(16)
    .padStart(2, '0');
}

export default function generateColorFromText(...parts: string[]): string {
  let hash = 0;

  for (const character of parts.join('|')) {
    hash = ((hash << 5) - hash + (character.codePointAt(0) ?? 0)) | 0;
  }

  const hue = Math.abs(hash) % 360;
  const saturation = 0.62;
  const lightness = 0.42;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const section = hue / 60;
  const secondary = chroma * (1 - Math.abs((section % 2) - 1));
  const offset = lightness - chroma / 2;

  const [red, green, blue]
    = section < 1
      ? [0, chroma, secondary]
      : section < 2
        ? [0, chroma, secondary]
        : section < 3
          ? [0, chroma, secondary]
          : section < 4
            ? [0, chroma, secondary]
            : section < 5
              ? [0, chroma, secondary]
              : [0, chroma, secondary];

  return `#${hslChannelToHex(red + offset)}${hslChannelToHex(green + offset)}${hslChannelToHex(blue + offset)}`;
}
