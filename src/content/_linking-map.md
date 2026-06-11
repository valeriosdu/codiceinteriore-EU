# Linking Map (Sprint 3)

Guida editoriale per la rete di internal link. **NON importato nel build.** Lo uso
durante la scrittura per garantire coerenza nella matrice di cross-link e per
non saltare riferimenti tematici importanti.

Regola: per ogni voce, `related[]` contiene 3-4 link selezionati dalla matrice
sotto. Inline nel body, 1-3 link aggiuntivi dove fanno senso semantico
(anchor text descrittivo, mai "clicca qui").

I link a voci ancora non scritte sono OK in `related[]`: il template salta i
target inesistenti, e quando la voce viene pubblicata l'item appare
automaticamente. Per gli **inline link**, invece, linkare solo voci esistenti
(404 evitati).

---

## Cluster Pianeti (10 voci)

| Slug      | Affini tematici          | Segno governato      | Casa analogica | Pillar preferito              |
|-----------|--------------------------|----------------------|----------------|-------------------------------|
| sole      | luna, marte              | leone                | quinta-casa    | cos-e-il-tema-natale          |
| luna      | sole, venere             | cancro               | quarta-casa    | tema-natale-relazioni         |
| mercurio  | venere, sole             | gemelli (vergine)    | terza-casa     | come-leggere-tema-natale      |
| venere    | mercurio, luna           | toro (bilancia)      | seconda-casa   | tema-natale-relazioni         |
| marte     | sole, saturno            | ariete (scorpione)   | prima-casa     | tema-natale-blocco-emotivo    |
| giove     | saturno, sole            | sagittario           | nona-casa      | come-leggere-tema-natale      |
| saturno   | giove, marte             | capricorno           | decima-casa    | tema-natale-blocco-emotivo    |
| urano     | saturno, mercurio        | acquario             | undicesima-casa| tema-natale-psicologico       |
| nettuno   | mercurio, luna           | pesci                | dodicesima-casa| tema-natale-psicologico       |
| plutone   | marte, saturno           | scorpione            | ottava-casa    | tema-natale-blocco-emotivo    |

## Cluster Segni (12 voci)

| Slug        | Pianeta governatore      | Casa analogica | Segno opposto | Pillar preferito              |
|-------------|--------------------------|----------------|---------------|-------------------------------|
| ariete      | marte                    | prima-casa     | bilancia      | tema-natale-blocco-emotivo    |
| toro        | venere                   | seconda-casa   | scorpione     | tema-natale-relazioni         |
| gemelli     | mercurio                 | terza-casa     | sagittario    | come-leggere-tema-natale      |
| cancro      | luna                     | quarta-casa    | capricorno    | tema-natale-relazioni         |
| leone       | sole                     | quinta-casa    | acquario      | tema-natale-psicologico       |
| vergine     | mercurio                 | sesta-casa     | pesci         | tema-natale-psicologico       |
| bilancia    | venere                   | settima-casa   | ariete        | tema-natale-relazioni         |
| scorpione   | plutone (marte co-)      | ottava-casa    | toro          | tema-natale-blocco-emotivo    |
| sagittario  | giove                    | nona-casa      | gemelli       | come-leggere-tema-natale      |
| capricorno  | saturno                  | decima-casa    | cancro        | tema-natale-blocco-emotivo    |
| acquario    | urano                    | undicesima-casa| leone         | tema-natale-psicologico       |
| pesci       | nettuno                  | dodicesima-casa| vergine       | tema-natale-psicologico       |

## Cluster Case (12 voci)

| Slug             | Segno analogico   | Pianeta tipico   | Casa opposta       | Pillar preferito              |
|------------------|-------------------|------------------|--------------------|-------------------------------|
| prima-casa       | ariete            | marte            | settima-casa       | cos-e-il-tema-natale          |
| seconda-casa     | toro              | venere           | ottava-casa        | tema-natale-psicologico       |
| terza-casa       | gemelli           | mercurio         | nona-casa          | come-leggere-tema-natale      |
| quarta-casa      | cancro            | luna             | decima-casa        | tema-natale-relazioni         |
| quinta-casa      | leone             | sole             | undicesima-casa    | tema-natale-psicologico       |
| sesta-casa       | vergine           | mercurio         | dodicesima-casa    | tema-natale-psicologico       |
| settima-casa     | bilancia          | venere           | prima-casa         | tema-natale-relazioni         |
| ottava-casa      | scorpione         | plutone          | seconda-casa       | tema-natale-blocco-emotivo    |
| nona-casa        | sagittario        | giove            | terza-casa         | come-leggere-tema-natale      |
| decima-casa      | capricorno        | saturno          | quarta-casa        | tema-natale-blocco-emotivo    |
| undicesima-casa  | acquario          | urano            | quinta-casa        | tema-natale-psicologico       |
| dodicesima-casa  | pesci             | nettuno          | sesta-casa         | tema-natale-psicologico       |

## Cluster Aspetti (8 voci)

| Slug             | Complementari (1-2)         | Pillar preferito              |
|------------------|------------------------------|-------------------------------|
| congiunzione     | opposizione                  | come-leggere-tema-natale      |
| opposizione      | congiunzione, quadratura     | tema-natale-relazioni         |
| trigono          | sestile                      | come-leggere-tema-natale      |
| quadratura       | opposizione                  | tema-natale-blocco-emotivo    |
| sestile          | trigono                      | come-leggere-tema-natale      |
| semisestile      | quinconce                    | come-leggere-tema-natale      |
| quinconce        | semisestile, quadratura      | tema-natale-blocco-emotivo    |
| semiquadratura   | quadratura                   | tema-natale-blocco-emotivo    |

## Cluster Punti (5 voci)

| Slug             | Casa associata | Pianeta tipico | Opposto         | Pillar preferito              |
|------------------|----------------|----------------|------------------|-------------------------------|
| ascendente       | prima-casa     | marte          | discendente     | cos-e-il-tema-natale          |
| discendente      | settima-casa   | venere         | ascendente      | tema-natale-relazioni         |
| medio-cielo      | decima-casa    | saturno        | fondo-cielo     | tema-natale-blocco-emotivo    |
| fondo-cielo      | quarta-casa    | luna           | medio-cielo     | tema-natale-relazioni         |
| nodi-lunari      | (asse 3-9)     | (nessuno)      | (self-opposto)  | tema-natale-psicologico       |

---

## Inline linking guidelines

- 1-3 link inline per voce, distribuiti nelle sezioni body
- Anchor text descrittivo (es. "il segno governato dal Sole è il [Leone]", NON "vedi anche [qui]")
- Evitare di linkare la STESSA URL più volte nella stessa voce
- I link inline NON sostituiscono i `related[]` (sono additivi)
- Inline link solo a voci ESISTENTI nel registry (404 evitati)
