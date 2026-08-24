package ma.doctorek.doctorek.agent;

import ma.doctorek.doctorek.agent.dto.AgentCard;
import ma.doctorek.doctorek.agent.dto.CreneauxCarte;
import ma.doctorek.doctorek.agent.dto.CreneauxCompact;
import ma.doctorek.doctorek.agent.dto.MedecinCarte;
import ma.doctorek.doctorek.agent.dto.MedecinCompact;
import ma.doctorek.doctorek.agent.dto.RdvBrouillon;
import ma.doctorek.doctorek.agent.dto.RdvCompact;
import ma.doctorek.doctorek.dto.CreneauResponse;
import ma.doctorek.doctorek.dto.MedecinProfile;
import ma.doctorek.doctorek.dto.NoteMedecinResponse;
import ma.doctorek.doctorek.dto.PagedMedecinsResponse;
import ma.doctorek.doctorek.dto.RendezVousResponse;
import ma.doctorek.doctorek.service.AgendaService;
import ma.doctorek.doctorek.service.AnnuaireService;
import ma.doctorek.doctorek.service.AvisService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AgentToolsTest {

    @Mock AnnuaireService annuaireService;
    @Mock AgendaService agendaService;
    @Mock AvisService avisService;

    AgentTools outils;
    AgentProperties properties;

    final UUID patient = UUID.randomUUID();
    final UUID medecinId = UUID.randomUUID();
    final LocalDate demain = LocalDate.now(ZoneId.of("Africa/Casablanca")).plusDays(1);

    @BeforeEach
    void setUp() {
        properties = new AgentProperties();
        outils = new AgentTools(annuaireService, agendaService, avisService, properties,
                ZoneId.of("Africa/Casablanca"));
        AgentTurnContext.ouvrir(patient, null, null, properties.getMaxOutilsParTour());
    }

    @AfterEach
    void tearDown() {
        AgentTurnContext.clear();
    }

    private MedecinProfile profil() {
        return new MedecinProfile(medecinId, "Amine", "Bennani", "Cardiologie", "Casablanca",
                "12 rue Ibn Sina", "INPE-001", 33.57, -7.58, null);
    }

    // ── rechercher_medecins ──────────────────────────────────────────────────

    @Test
    @DisplayName("recherche sans critère : refuse au lieu de ramener tout l'annuaire")
    void rechercheSansCritere_refuse() {
        assertThatThrownBy(() -> outils.rechercherMedecins(null, "  "))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("spécialité");

        verify(annuaireService, never()).searchMedecins(any(), any(), any(), any(), anyInt(), anyInt());
    }

    @Test
    @DisplayName("recherche : carte complète pour l'UI, projection réduite pour le modèle")
    void recherche_produitCarteEtProjection() {
        when(annuaireService.searchMedecins(eq("Cardiologie"), eq("Casablanca"), isNull(),
                eq("all"), eq(1), eq(properties.getMaxResultatsRecherche())))
                .thenReturn(new PagedMedecinsResponse(List.of(profil()), 1, 1, 1, 5));
        when(avisService.notesParMedecins(List.of(medecinId)))
                .thenReturn(List.of(new NoteMedecinResponse(medecinId, 4.8, 12)));

        List<MedecinCompact> compact = outils.rechercherMedecins("Cardiologie", "Casablanca");

        assertThat(compact).singleElement().satisfies(m -> {
            assertThat(m.id()).isEqualTo(medecinId);
            assertThat(m.nom()).isEqualTo("Dr Amine Bennani");
            assertThat(m.note()).isEqualTo(4.8);
        });

        AgentCard carte = AgentTurnContext.courant().cartes().get(0);
        assertThat(carte.type()).isEqualTo(AgentCard.TYPE_MEDECINS);
        @SuppressWarnings("unchecked")
        List<MedecinCarte> donnees = (List<MedecinCarte>) carte.donnees();
        // L'adresse n'existe que dans la carte : elle n'entre jamais dans le prompt.
        assertThat(donnees).singleElement()
                .extracting(c -> c.profil().adresse())
                .isEqualTo("12 rue Ibn Sina");
    }

    @Test
    @DisplayName("recherche sans avis : note nulle, pas d'échec")
    void rechercheSansAvis_noteNulle() {
        when(annuaireService.searchMedecins(any(), any(), any(), any(), anyInt(), anyInt()))
                .thenReturn(new PagedMedecinsResponse(List.of(profil()), 1, 1, 1, 5));
        when(avisService.notesParMedecins(any())).thenReturn(List.of());

        assertThat(outils.rechercherMedecins("Cardiologie", null))
                .singleElement()
                .extracting(MedecinCompact::note)
                .isNull();
    }

    @Test
    @DisplayName("recherche : affiche les mieux notés en premier et les profils sans avis en dernier")
    void recherche_trieParNoteDecroissante() {
        UUID mieuxNoteId = UUID.randomUUID();
        UUID sansAvisId = UUID.randomUUID();
        MedecinProfile mieuxNote = new MedecinProfile(
                mieuxNoteId, "Sara", "Alami", "Cardiologie", "Casablanca",
                "20 boulevard Zerktouni", "INPE-002", 33.58, -7.63, null);
        MedecinProfile sansAvis = new MedecinProfile(
                sansAvisId, "Nadia", "Chraibi", "Cardiologie", "Casablanca",
                "5 rue Atlas", "INPE-003", 33.59, -7.62, null);

        when(annuaireService.searchMedecins(any(), any(), any(), any(), anyInt(), anyInt()))
                .thenReturn(new PagedMedecinsResponse(
                        List.of(profil(), sansAvis, mieuxNote), 3, 3, 1, 5));
        when(avisService.notesParMedecins(List.of(medecinId, sansAvisId, mieuxNoteId)))
                .thenReturn(List.of(
                        new NoteMedecinResponse(medecinId, 4.2, 15),
                        new NoteMedecinResponse(mieuxNoteId, 4.9, 31)));

        assertThat(outils.rechercherMedecins("Cardiologie", "Casablanca"))
                .extracting(MedecinCompact::id)
                .containsExactly(mieuxNoteId, medecinId, sansAvisId);

        @SuppressWarnings("unchecked")
        List<MedecinCarte> cartes = (List<MedecinCarte>) AgentTurnContext.courant().cartes().get(0).donnees();
        assertThat(cartes)
                .extracting(carte -> carte.profil().id())
                .containsExactly(mieuxNoteId, medecinId, sansAvisId);
    }

    // ── medecins_a_proximite ─────────────────────────────────────────────────

    @Test
    @DisplayName("proximité sans géolocalisation : explique au modèle quoi faire")
    void proximiteSansPosition_expliqueAuModele() {
        assertThatThrownBy(() -> outils.medecinsAProximite("Cardiologie", null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("rechercher_medecins");
    }

    @Test
    @DisplayName("proximité : rayon plafonné à 50 km, distance transmise au modèle")
    void proximite_plafonneLeRayon() {
        AgentTurnContext.clear();
        AgentTurnContext.ouvrir(patient, 33.57, -7.58, 6);

        when(annuaireService.searchNearby(eq(33.57), eq(-7.58), eq(50d), eq("Cardiologie")))
                .thenReturn(List.of(new AnnuaireService.MedecinNearbyResult(profil(), 2.1)));
        when(avisService.notesParMedecins(any())).thenReturn(List.of());

        assertThat(outils.medecinsAProximite("Cardiologie", 9999))
                .singleElement()
                .extracting(MedecinCompact::distanceKm)
                .isEqualTo(2.1);
    }

    // ── creneaux_medecin ─────────────────────────────────────────────────────

    @Test
    @DisplayName("créneaux : un seul appel couvre plusieurs jours, seules les heures libres partent au modèle")
    void creneaux_grouperParJourEtFiltrerLesPris() {
        when(annuaireService.getMedecinProfile(medecinId)).thenReturn(profil());
        when(agendaService.getCreneauxDisponibles(eq(medecinId), eq(demain)))
                .thenReturn(List.of(
                        new CreneauResponse("09:00", "09:30", true),
                        new CreneauResponse("09:30", "10:00", false)));
        when(agendaService.getCreneauxDisponibles(eq(medecinId), eq(demain.plusDays(1))))
                .thenReturn(List.of());

        List<CreneauxCompact> compact =
                outils.creneauxMedecin(medecinId.toString(), demain.toString(), 2);

        assertThat(compact).singleElement().satisfies(j -> {
            assertThat(j.date()).isEqualTo(demain);
            assertThat(j.heuresLibres()).containsExactly("09:00");
        });

        AgentCard carte = AgentTurnContext.courant().cartes().get(0);
        CreneauxCarte donnees = (CreneauxCarte) carte.donnees();
        // Profil complet : le tiroir de réservation en a besoin au clic sur un créneau.
        assertThat(donnees.medecin().adresse()).isEqualTo("12 rue Ibn Sina");
        // La carte garde les créneaux pris : l'UI les affiche barrés.
        assertThat(donnees.jours()).singleElement()
                .extracting(j -> j.creneaux().size()).isEqualTo(2);
    }

    @Test
    @DisplayName("créneaux : nombre de jours plafonné par la configuration")
    void creneaux_plafonneLesJours() {
        when(annuaireService.getMedecinProfile(medecinId)).thenReturn(profil());
        when(agendaService.getCreneauxDisponibles(eq(medecinId), any())).thenReturn(List.of());

        outils.creneauxMedecin(medecinId.toString(), demain.toString(), 90);

        verify(agendaService, never()).getCreneauxDisponibles(
                medecinId, demain.plusDays(properties.getMaxJoursCreneaux()));
    }

    @Test
    @DisplayName("date mal formée : message d'erreur exploitable par le modèle")
    void dateInvalide_messageExploitable() {
        assertThatThrownBy(() -> outils.creneauxMedecin(medecinId.toString(), "18/08/2026", 1))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("AAAA-MM-JJ");
    }

    @Test
    @DisplayName("identifiant de médecin invalide : refuse sans appeler l'annuaire")
    void medecinIdInvalide_refuse() {
        assertThatThrownBy(() -> outils.profilMedecin("pas-un-uuid"))
                .isInstanceOf(IllegalArgumentException.class);
        verify(annuaireService, never()).getMedecinProfile(any());
    }

    // ── mes_rendez_vous ──────────────────────────────────────────────────────

    @Test
    @DisplayName("mes rendez-vous : lit l'identité du tour, jamais un identifiant fourni")
    void mesRdv_utiliseLIdentiteDuTour() {
        when(agendaService.getRdvsPatient(patient)).thenReturn(List.of());

        assertThat(outils.mesRendezVous()).isEmpty();

        verify(agendaService).getRdvsPatient(patient);
    }

    @Test
    @DisplayName("mes rendez-vous : écarte les annulés et les dates passées")
    void mesRdv_filtreAnnulesEtPasses() {
        RendezVousResponse aVenir = rdv(demain, LocalTime.of(14, 30), "CONFIRME");
        RendezVousResponse annule = rdv(demain, LocalTime.of(9, 0), "ANNULE");
        RendezVousResponse passe = rdv(demain.minusDays(30), LocalTime.of(9, 0), "TERMINE");

        when(agendaService.getRdvsPatient(patient)).thenReturn(List.of(passe, annule, aVenir));
        when(annuaireService.getMedecinProfile(medecinId)).thenReturn(profil());

        List<RdvCompact> compact = outils.mesRendezVous();

        assertThat(compact).singleElement().satisfies(r -> {
            assertThat(r.heure()).isEqualTo(LocalTime.of(14, 30));
            assertThat(r.medecinNom()).isEqualTo("Dr Amine Bennani");
        });
    }

    // ── preparer_rdv ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("préparer : créneau libre, brouillon complet et aucune écriture")
    void preparer_creneauLibre() {
        when(annuaireService.getMedecinProfile(medecinId)).thenReturn(profil());
        when(agendaService.getCreneauxDisponibles(medecinId, demain))
                .thenReturn(List.of(new CreneauResponse("14:30", "15:00", true)));

        RdvBrouillon brouillon = outils.preparerRdv(
                medecinId.toString(), demain.toString(), "14:30", "douleur thoracique");

        assertThat(brouillon.creneauLibre()).isTrue();
        assertThat(brouillon.patientId()).isEqualTo(patient);
        assertThat(brouillon.dureeMinutes()).isEqualTo(30);
        assertThat(brouillon.motif()).isEqualTo("douleur thoracique");

        verify(agendaService, never()).prendreRdv(any(), any());
    }

    @Test
    @DisplayName("préparer : créneau entre-temps réservé, brouillon marqué indisponible")
    void preparer_creneauPris() {
        when(annuaireService.getMedecinProfile(medecinId)).thenReturn(profil());
        when(agendaService.getCreneauxDisponibles(medecinId, demain))
                .thenReturn(List.of(new CreneauResponse("14:30", "15:00", false)));

        RdvBrouillon brouillon = outils.preparerRdv(
                medecinId.toString(), demain.toString(), "14:30", null);

        assertThat(brouillon.creneauLibre()).isFalse();
        assertThat(brouillon.indisponibilite()).contains("réservé");
        assertThat(brouillon.patientId()).isNull();
    }

    @Test
    @DisplayName("préparer : heure absente de l'agenda, brouillon marqué indisponible")
    void preparer_creneauInexistant() {
        when(annuaireService.getMedecinProfile(medecinId)).thenReturn(profil());
        when(agendaService.getCreneauxDisponibles(medecinId, demain)).thenReturn(List.of());

        RdvBrouillon brouillon = outils.preparerRdv(
                medecinId.toString(), demain.toString(), "14:30", null);

        assertThat(brouillon.creneauLibre()).isFalse();
        assertThat(brouillon.indisponibilite()).contains("agenda");
    }

    // ── plafond ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("au-delà du plafond d'outils : le tour est interrompu")
    void plafondOutils_interrompLeTour() {
        AgentTurnContext.clear();
        AgentTurnContext.ouvrir(patient, null, null, 1);

        when(annuaireService.searchMedecins(any(), any(), any(), any(), anyInt(), anyInt()))
                .thenReturn(new PagedMedecinsResponse(List.of(), 0, 0, 1, 5));

        outils.rechercherMedecins("Cardiologie", null);

        assertThatThrownBy(() -> outils.rechercherMedecins("Dermatologie", null))
                .isInstanceOf(ma.doctorek.doctorek.exception.AgentLimiteOutilsException.class);
    }

    private RendezVousResponse rdv(LocalDate date, LocalTime heure, String statut) {
        return new RendezVousResponse(UUID.randomUUID(), medecinId, patient, null, null,
                date, heure, 30, statut, "motif", null, null);
    }
}
