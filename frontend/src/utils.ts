
export function nodeNameFromIndex(index: number): string {
  let name = "";
  let num = index + 1;
  while (num > 0) {
    const remainder = num % 26;
    if (remainder === 0) {
      name = "Z" + name;
      num = Math.floor(num / 26) - 1;
    } else {
      name = String.fromCharCode(64 + remainder) + name;
      num = Math.floor(num / 26);
    }
  }
  return name;
}