type WithIds = { id: string; publicId: string }

export const toWire = <T extends WithIds>(
  row: T,
): Omit<T, 'id' | 'publicId'> & { id: string } => {
  const { id: _internal, publicId, ...rest } = row
  return { id: publicId, ...rest }
}
