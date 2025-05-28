const hashCode = (text: string): number => {
  if (!text) return 0;

  let state = 13; // prime
  for (let index = 0; index < text.length; index++) {
    const charCode = text.charCodeAt(index);
    state += state * charCode;
    // Prevent overflow by %
    state %= (charCode * 3109); // prime
  }
  return state;
};

export const getTagColor = (tag: string): string => {
  const NCOLORS = 20;
  const AVOID_RED = 25;

  const sat = 91;
  const light = 55;
  const trans = 0.6;

  if (tag === '#bug') {
    return `hsla(0, ${sat}%, ${light}%, ${trans})`;
  }

  const hash = hashCode(tag);
  const hue = AVOID_RED + Math.floor((hash % (360 - 2 * AVOID_RED)) / NCOLORS) * NCOLORS;
  return `hsla(${hue}, ${sat}%, ${light}%, ${trans})`;
};

export const extractTags = (text: string): string[] => {
  const matches = text.match(/#\w+/g) || [];
  return [...new Set(matches)];
};

export const processContent = (content: string): string => {
  const lines = content.split('\n');
  const processedLines = lines.map(line => {
    const tags = line.match(/#\w+/g) || [];
    const nonTagContent = line.replace(/#\w+/g, '').replace(/,/g, '').trim();
    if (tags.length > 0 && nonTagContent === '') {
      return null;
    }
    return line;
  }).filter((line): line is string => line !== null);
  return processedLines.join('\n');
};
