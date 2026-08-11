import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { AvisSynthese } from './AvisSynthese'

describe('AvisSynthese', () => {
  test('affiche la moyenne et le nombre d’avis', () => {
    render(<AvisSynthese noteMoyenne={4.3} nombreAvis={12} repartition={[0, 1, 2, 3, 6]} />)

    expect(screen.getByText('4.3')).toBeInTheDocument()
    expect(screen.getByText('12 avis vérifiés')).toBeInTheDocument()
  })

  test('accorde le libellé au singulier pour un seul avis', () => {
    render(<AvisSynthese noteMoyenne={5} nombreAvis={1} repartition={[0, 0, 0, 0, 1]} />)

    expect(screen.getByText('1 avis vérifié')).toBeInTheDocument()
  })

  test('invite plutôt que d’afficher une note de zéro quand il n’y a aucun avis', () => {
    render(<AvisSynthese noteMoyenne={null} nombreAvis={0} repartition={[0, 0, 0, 0, 0]} />)

    expect(screen.getByText('Aucun avis pour le moment')).toBeInTheDocument()
    expect(screen.queryByText('0.0')).not.toBeInTheDocument()
  })

  test('décrit chaque barre de l’histogramme pour les lecteurs d’écran', () => {
    render(<AvisSynthese noteMoyenne={4} nombreAvis={4} repartition={[1, 0, 0, 0, 3]} />)

    expect(screen.getByLabelText('3 avis à 5 sur 5')).toBeInTheDocument()
    expect(screen.getByLabelText('0 avis à 2 sur 5')).toBeInTheDocument()
  })
})
