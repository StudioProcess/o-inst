export function lerp(a, b, t) {
  return a + ((b - a) * t);
}

export function inverseLerpUnclamped(a, b, value) {
  return (value - a) / (b - a);
}

export function inverseLerpClamped(a, b, value) {
  return clamp(0.0, 1.0, (value - a) / (b - a));
}

export function clamp(min, max, value) {
  if (value < min) {
    return min;
  } else if (value > max) {
    return max;
  }
  return value;
}
