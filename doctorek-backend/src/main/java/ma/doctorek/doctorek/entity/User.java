package ma.doctorek.doctorek.entity;

import jakarta.persistence.*;
import lombok.*;
import ma.doctorek.doctorek.enums.Role;
import ma.doctorek.doctorek.enums.UserStatus;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(schema = "auth", name = "users")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(unique = true, length = 20)
    private String phone;

    @Column(nullable = false, length = 255)
    private String password;

    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    @Builder.Default
    @Column(nullable = false, length = 5)
    private String lang = "fr";

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserStatus status = UserStatus.ACTIVE;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @Builder.Default
    @Column(name = "email_verified", nullable = false)
    private boolean emailVerified = false;

    @Column(name = "verification_code", length = 6)
    private String verificationCode;

    @Column(name = "verification_code_expires_at")
    private Instant verificationCodeExpiresAt;

    @Column(name = "keycloak_id", unique = true, length = 36)
    private String keycloakId;

    @Column(name = "avatar_url", length = 512)
    private String avatarUrl;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    private void prePersist() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    private void preUpdate() {
        this.updatedAt = Instant.now();
    }

    public void updateProfile(String firstName, String lastName, String phone, String lang) {
        this.firstName = firstName;
        this.lastName  = lastName;
        this.phone     = phone;
        if (lang != null) this.lang = lang;
    }

    public void markEmailVerified() {
        this.emailVerified = true;
        this.verificationCode = null;
        this.verificationCodeExpiresAt = null;
    }

    /**
     * Anonymise l'identité du compte lors d'une suppression. Libère l'email et le
     * téléphone (contraintes UNIQUE) pour une ré-inscription future, coupe tout
     * lien Keycloak et bloque la connexion. Les données médicales liées (dossier,
     * ordonnances, RDV) restent rattachées à cette coquille anonyme.
     */
    public void anonymize() {
        this.email = "deleted-" + this.id + "@supprime.doctorek";
        this.phone = null;
        this.firstName = "Compte";
        this.lastName = "supprimé";
        this.keycloakId = null;
        this.avatarUrl = null;
        this.verificationCode = null;
        this.verificationCodeExpiresAt = null;
        this.active = false;
        this.status = UserStatus.DELETED;
        this.deletedAt = Instant.now();
    }
}
