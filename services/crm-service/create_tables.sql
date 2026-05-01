CREATE TABLE IF NOT EXISTS comptes (
    "Id" SERIAL PRIMARY KEY,
    "Nom" VARCHAR(200) NOT NULL,
    "Email" VARCHAR(180) NULL,
    "Telephone" VARCHAR(20) NULL,
    "SecteurActivite" VARCHAR(150) NULL,
    "Adresse" VARCHAR(500) NULL,
    "DateCreation" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "IX_comptes_Nom" ON comptes ("Nom");

CREATE TABLE IF NOT EXISTS contacts (
    "Id" SERIAL PRIMARY KEY,
    "Prenom" VARCHAR(100) NOT NULL,
    "Nom" VARCHAR(100) NOT NULL,
    "Email" VARCHAR(180) NULL,
    "Telephone" VARCHAR(20) NULL,
    "Type" VARCHAR(50) NOT NULL DEFAULT 'Autre',
    "Adresse" VARCHAR(300) NULL,
    "DateCreation" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "CompteId" INTEGER NOT NULL,
    CONSTRAINT "FK_contacts_comptes_CompteId" FOREIGN KEY ("CompteId") REFERENCES comptes ("Id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "IX_contacts_CompteId" ON contacts ("CompteId");

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260402000000_AddCompteContact', '8.0.0')
ON CONFLICT DO NOTHING;
