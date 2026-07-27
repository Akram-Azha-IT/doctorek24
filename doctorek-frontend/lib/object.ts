/**
 * Renvoie une copie de l'objet privée des clés indiquées.
 *
 * <p>Écarter un champ par déstructuration (`const { motDePasse, ...reste } = valeurs`)
 * laisse une variable jamais lue, que le linter signale ; la marquer avec l'opérateur
 * `void` déplace simplement le problème vers une autre règle. Nommer l'intention règle
 * les deux et se relit mieux.
 */
export function omit<T extends object, K extends keyof T>(
  source: T,
  ...keys: readonly K[]
): Omit<T, K> {
  const copy = { ...source } as Record<string, unknown>
  for (const key of keys) delete copy[key as string]
  return copy as Omit<T, K>
}
