package ma.doctorek.doctorek.entity;

import jakarta.persistence.*;
import ma.doctorek.doctorek.enums.Role;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(schema = "auth", name = "users")
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

    @Column(nullable = false, length = 5)
    private String lang = "fr";

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "email_verified", nullable = false)
    private boolean emailVerified = false;

    @Column(name = "verification_code", length = 6)
    private String verificationCode;

    @Column(name = "verification_code_expires_at")
    private Instant verificationCodeExpiresAt;

    @Column(name = "keycloak_id", unique = true, length = 36)
    private String keycloakId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected User() {}

    private User(Builder builder) {
        this.email     = builder.email;
        this.phone     = builder.phone;
        this.password  = builder.password;
        this.firstName = builder.firstName;
        this.lastName  = builder.lastName;
        this.role      = builder.role;
        this.lang      = builder.lang;
    }

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

    public void setVerificationCode(String code) {
        this.verificationCode = code;
    }

    public void setVerificationCodeExpiresAt(Instant expiresAt) {
        this.verificationCodeExpiresAt = expiresAt;
    }

    public void setKeycloakId(String keycloakId) { this.keycloakId = keycloakId; }

    public void setActive(boolean active) { this.active = active; }

    public void markEmailVerified() {
        this.emailVerified = true;
        this.verificationCode = null;
        this.verificationCodeExpiresAt = null;
    }

    public UUID getId()                           { return id; }
    public String getEmail()                      { return email; }
    public String getPhone()                      { return phone; }
    public String getPassword()                   { return password; }
    public String getFirstName()                  { return firstName; }
    public String getLastName()                   { return lastName; }
    public Role getRole()                         { return role; }
    public String getLang()                       { return lang; }
    public boolean isActive()                     { return active; }
    public boolean isEmailVerified()              { return emailVerified; }
    public String getVerificationCode()           { return verificationCode; }
    public Instant getVerificationCodeExpiresAt() { return verificationCodeExpiresAt; }
    public String getKeycloakId()                 { return keycloakId; }
    public Instant getCreatedAt()                 { return createdAt; }
    public Instant getUpdatedAt()                 { return updatedAt; }

    public static Builder builder() { return new Builder(); }

    public static final class Builder {
        private String email;
        private String phone;
        private String password;
        private String firstName;
        private String lastName;
        private Role   role = Role.PATIENT;
        private String lang = "fr";

        private Builder() {}

        public Builder email(String email)         { this.email     = email;     return this; }
        public Builder phone(String phone)         { this.phone     = phone;     return this; }
        public Builder password(String password)   { this.password  = password;  return this; }
        public Builder firstName(String firstName) { this.firstName = firstName; return this; }
        public Builder lastName(String lastName)   { this.lastName  = lastName;  return this; }
        public Builder role(Role role)             { this.role      = role;      return this; }
        public Builder lang(String lang)           { if (lang != null) this.lang = lang; return this; }

        public User build() { return new User(this); }
    }
}
