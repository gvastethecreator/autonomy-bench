/** UTF-16 length ÷ 4, rounded. Standard English/code approximation, not a tokenizer. */
export function approxTokensFromText(text) {
  const chars = String(text ?? '').length;
  return Math.round(chars / 4);
}

export function outputSizeFromHtml(html) {
  const outputChars = String(html ?? '').length;
  return {
    outputChars,
    outputTokensApprox: approxTokensFromText(html),
    outputTokensMethod: 'chars/4',
  };
}
