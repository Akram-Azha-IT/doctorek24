package ma.doctorek.doctorek.enums;

/**
 * Cycle de vie d'un compte. ACTIVE = normal (activé ou désactivé via is_active).
 * DELETED = identité anonymisée : le compte n'apparaît plus dans l'admin et ne
 * peut plus se connecter, mais la ligne subsiste pour préserver les données
 * médicales liées (rétention légale).
 */
public enum UserStatus {
    ACTIVE,
    DELETED
}
