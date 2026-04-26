ALTER TABLE agenda.disponibilites
    ADD COLUMN frequence          VARCHAR(20)  NOT NULL DEFAULT 'TOUTES_LES_SEMAINES',
    ADD COLUMN interval_semaines  INT          NOT NULL DEFAULT 1,
    ADD COLUMN date_debut         DATE         NOT NULL DEFAULT CURRENT_DATE,
    ADD COLUMN type_fin           VARCHAR(10)  NOT NULL DEFAULT 'JAMAIS',
    ADD COLUMN date_fin           DATE;
