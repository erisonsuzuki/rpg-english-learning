export function getEventTargetValue(target: EventTarget | null | undefined) {
  const value = (target as { value?: string } | null | undefined)?.value;
  return typeof value === "string" ? value : "";
}

export function getEventTargetScrollTop(
  target: EventTarget | null | undefined
) {
  const scrollTop = (target as { scrollTop?: number } | null | undefined)
    ?.scrollTop;
  return typeof scrollTop === "number" ? scrollTop : 0;
}
