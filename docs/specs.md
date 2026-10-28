# Spécifications — App de courses Damien & Laeti

> Nom de travail : **Panier** (à renommer)
> Version du document : 1.4 — 28/10/2026

---

## 1. Vision

Une web app partagée entre Damien et Laetitia pour gérer les courses du foyer : liste en temps réel, recettes, planning des repas et budget. Elle doit être **rapide à utiliser en magasin**, **simple** et **ludique**, avec un style coloré et rond.

### Principes
- **Deux utilisateurs seulement** : Damien et Laeti, qui accèdent à l'app par son lien, sans compte.
- **Rapidité d'abord** : ajouter un article ou cocher doit prendre moins de 2 secondes.
- **Le fun sert l'usage** : stats, roue, récap… jamais au détriment de la lisibilité en magasin.
- **Utilisable sur iPhone et Android** via le navigateur, installable sur l'écran d'accueil.
- **Zéro friction de saisie** : exigence prioritaire, voir ci-dessous.
- **Livrer tôt, enrichir par l'usage** : une V0 utilisable en quelques soirs, puis chaque ajout testé en conditions réelles.

### Règle d'or : zéro friction de saisie
Remplir l'app ne doit jamais devenir une corvée, ni la première semaine ni au bout d'un an. La recherche sur les outils de suivi montre que le coût de saisie est la première cause d'abandon, et que les pauses font partie de l'usage normal (cf. §12). Toute fonctionnalité est conçue selon ces règles :

1. **L'app déduit au lieu de demander.** Toute information qui peut être tirée de l'usage (historique, planning, achats) n'est jamais demandée.
2. **Aucune saisie n'est obligatoire.** Chaque champ facultatif a un bouton « passer » bien visible.
3. **Le silence vaut l'option la plus probable.** Une information pré-remplie non corrigée est considérée comme juste ; une alerte ignorée applique le choix le plus probable (ex. doublon ignoré = fusion).
4. **Une action = un tap.** Au-delà de deux taps pour une action courante, la fonction est à revoir.
5. **Jamais de relance.** Pas de « tu n'as pas saisi ton ticket », pas de rappel pour une info manquante. Les stats tolèrent les trous.
6. **Valeurs par défaut intelligentes** partout (quantités, cuisinier, parts).
7. **Proposer plutôt que faire taper.** Suggestions, favoris et autocomplétion avant tout champ libre.
8. **Annuler plutôt que confirmer.** Pas de « Êtes-vous sûr ? » : l'action est faite, avec un bouton « Annuler » pendant 5 secondes.
9. **Gestes en raccourci, jamais en exclusivité.** Chaque geste a un équivalent visible à l'écran.

Critère de validation de chaque fonctionnalité : *est-ce qu'on l'utiliserait encore au bout de 3 mois ?* Il se vérifie sur les données d'usage (cf. 5.9).

### Conçue pour les pauses
On lâchera certaines fonctions, et c'est prévu.

- **Abandon gracieux** : une fonction ignorée plusieurs fois de suite cesse de se proposer d'elle-même (elle reste accessible manuellement). Exemple : pas de montant saisi lors des 6 dernières courses → le pavé « montant » ne s'ouvre plus automatiquement. Une seule saisie le réactive.
- **Indépendance des fonctions** : lâcher une fonction ne dégrade jamais les autres.
- **Reprise sans rattrapage** : après une absence (vacances, oubli), l'app reprend comme si de rien n'était. Pas de trou rouge dans les stats, pas de « 3 semaines sans saisie ».
- **Détection des pauses** : aucune course pendant plus de 10 jours = pause. Les estimations (stock déduit, « à racheter bientôt ») sont alors mises en veille puis recalibrées, pour ne pas suggérer toute la liste au retour de vacances.

### Le fun qui dure
Le fun s'use par habitude. Pour qu'il tienne après la première semaine :

- **Concentré sur les moments forts** plutôt que partout : la fin des courses, le récap du mois, la roue.
- **Nouveauté légère** : les animations de fin de courses, les phrases et les anecdotes du récap tournent parmi un large répertoire, jamais deux fois de suite les mêmes.
- **Jamais de pression** : pas de séries à tenir, pas de culpabilisation.

### Hors périmètre
- Mode hors ligne (le réseau passe dans les magasins fréquentés).
- Configuration manuelle de rayons ou de magasins.
- Scan de tickets de caisse.
- Prix par article.
- Restes automatiques dans le planning.

---

## 2. Stack technique

| Élément | Choix |
|---|---|
| Développement | Codé par Claude, dépôt GitHub `dash52000/Course_magasins` |
| Front | React + Vite, web app installable (PWA), pas d'APK |
| Hébergement | GitHub Pages, déploiement automatique à chaque push |
| Backend | Supabase (base PostgreSQL, temps réel, stockage, fonctions serveur) |
| Accès | Par le lien de l'app, sans connexion ni compte |
| Identité | Choix « Damien » ou « Laeti » à la première ouverture, mémorisé sur le téléphone |
| Icônes | Emoji natifs |
| Photos | Supabase Storage |
| Sauvegarde | Export JSON manuel + sauvegarde automatique hebdomadaire (cf. 4.6) |
| Import de recettes | Fonction serveur Supabase (Edge Function) |
| Partage vers l'app | Web Share Target (Android uniquement ; sur iPhone, coller le lien) |
| Scan code-barres | BarcodeDetector natif, repli zxing-wasm ; produits via API Open Food Facts |
| Notifications | Web Push (sur iPhone : nécessite l'app installée sur l'écran d'accueil, iOS 16.4+) |

---

## 3. Découpage en versions

Chaque version est utilisable seule et s'appuie sur les données accumulées par les précédentes.

| Version | Thème | Contenu |
|---|---|---|
| **V0** | Utilisable tout de suite | Liste temps réel, ajout rapide simple, cocher / décocher, quantités +/−, suppression avec annulation, favoris automatiques + pack de démarrage, doublons fusionnés, « Courses terminées », historique simple, sauvegarde, journal d'usage, PWA, choix de l'utilisateur à la première ouverture |
| **V1** | Le confort | Liste « pas urgent », gestes, ordre de passage appris, ajout rapide avancé (dictée), scan code-barres, mots pour l'autre, fin de courses soignée, recharger une ancienne liste, décroissance des favoris, écran « Coulisses » |
| **V2** | La cuisine | Recettes, import par lien et partage, planning, « qui cuisine », envoi à la liste, roue des menus, tags sport, mode cuisine, notes à deux, accueil contextuel, carnet qui se remplit tout seul |
| **V3** | Intelligence & fun | Stock déduit, anti-restes, « à racheter bientôt », « comme d'habitude », listes thématiques, budget, journal des repas, stats, récap du mois, notif « je pars », saisons et fêtes |

Les mécanismes d'abandon gracieux et de détection des pauses s'appliquent à chaque fonction dès sa version d'arrivée.

---

## 4. V0 — Utilisable tout de suite

Objectif : remplacer dès la première semaine la liste actuelle (papier, notes, messages). Livrable en quelques soirs.

### 4.1 Liste de courses
- **Liste unique** partagée, sans rayons à configurer.
- **Synchronisation temps réel** : un ajout ou un cochage de l'un apparaît immédiatement chez l'autre.
- Chaque article affiche : icône, nom, quantité (facultative), note (facultative), auteur de l'ajout (pastille D / L).
- **Tap sur la ligne** = cocher : l'article est barré et descend en bas de liste. Nouveau tap = décocher.
- **Boutons + / −** visibles sur la quantité.
- **Menu « … »** sur chaque ligne : modifier la note, supprimer (avec « Annuler » pendant 5 s).
- **Bouton « Courses terminées »**, dans la zone du pouce : archive les articles cochés dans l'historique et les retire de la liste. Les non-cochés restent.

### 4.2 Ajout rapide
- Un champ de saisie unique **en bas de l'écran**, dans la zone du pouce (usage à une main, panier dans l'autre).
- Saisie multi-articles découpée automatiquement :
  - `2 lait, pain, 500g farine` → `lait ×2`, `pain`, `farine 500 g`
- Séparateurs reconnus : virgule, retour à la ligne, « et ».
- Quantités reconnues : nombre seul (`2`), nombre + unité (`500g`, `1 kg`, `2 L`).
- **Autocomplétion** depuis les produits connus dès la 2e lettre.
- Chaque article saisi est rattaché à un **produit canonique** (cf. §10) : existant si le nom correspond, créé sinon.

### 4.3 Favoris
- **Pas de catalogue à remplir** : un produit acheté 2 fois devient favori automatiquement.
- **Pack de démarrage** : ~50 produits courants pré-chargés (lait, pain, œufs, pâtes…), avec icônes. Les inutiles se suppriment depuis le menu « … ».
- Écran Favoris : ajout à la liste en **un tap**.
- Étoile pour mettre un produit en favori manuellement.
- Quantité et note par défaut **apprises** : la dernière utilisée est reprise.

### 4.4 Doublons
- Si le produit ajouté est déjà dans la liste (non coché), il est **fusionné par défaut** : la quantité s'additionne et un bandeau non bloquant informe :
  > « Lait déjà dans la liste (ajouté par Laeti) → ×3 — Séparer / Annuler »
- Sans action, la fusion est conservée.
- Comparaison sur le produit canonique, donc insensible à la casse, aux accents et au pluriel simple (`tomate` = `Tomates`).

### 4.5 Historique simple
- Chaque « Courses terminées » crée une **course** datée avec ses articles et l'ordre de cochage (enregistré dès la V0 pour alimenter l'ordre appris en V1).
- Liste des courses passées, consultable.

### 4.6 Sauvegarde
- **Export JSON** de toutes les données, depuis l'onglet Foyer, en un tap.
- **Sauvegarde automatique hebdomadaire** : une GitHub Action exporte la base vers un dépôt privé. Elle maintient aussi le projet Supabase actif, la formule gratuite mettant en pause les projets inactifs.
- **Import** d'une sauvegarde JSON pour restaurer.

### 4.7 Journal d'usage
- Enregistrement discret, dès la V0, de l'utilisation de chaque fonction (utilisée, ignorée, date).
- Alimente l'abandon gracieux et l'écran « Coulisses » (cf. 5.9).
- Aucune donnée ne sort de la base Supabase du foyer.

### 4.8 Accès et installation
- Accès par le **lien de l'app**, partagé uniquement entre Damien et Laeti. Aucun compte, aucune connexion.
- **À la première ouverture** sur un téléphone : « Tu es Damien ou Laeti ? ». Le choix est mémorisé sur l'appareil et modifiable dans Foyer.
- Installable sur l'écran d'accueil (icône, plein écran, couleur de thème).
- Ouverture directe sur la liste (enrichie en V2 par l'accueil contextuel, cf. 6.8).

---

## 5. V1 — Le confort

### 5.1 Gestes
Raccourcis des actions déjà visibles en V0, jamais leur seul accès :
- Swipe vers la gauche = supprimer (avec « Annuler »)
- Swipe vers la droite = passer en « pas urgent »
- Appui long = modifier la note

### 5.2 Liste « pas urgent »
Pour ce qui se prend « la prochaine fois que tu passes par là » : piles, ampoules, produit vaisselle…
- Section **repliée en bas de la liste**, avec un compteur (« 3 pas urgents »).
- Un article y passe par le menu « … », d'un swipe vers la droite, ou en tapant `!pu` à l'ajout (« piles !pu »).
- Ne compte pas dans la barre de progression ni dans « Courses terminées » : les articles non pris restent.
- Un article coché remonte normalement dans l'historique.

### 5.3 Ordre de passage appris
- L'app retient l'ordre dans lequel vous cochez en magasin et trie la liste en conséquence. Aucune configuration.
- Actif après 3 courses, s'améliore ensuite. Un article inconnu va en haut.
- **Progression en magasin** : barre qui se remplit au fil des cochages, avec « plus que 4 articles ». Jamais de reproche.
- Gestion de plusieurs magasins : voir point ouvert (§11).

### 5.4 Ajout rapide avancé
- **Compatible dictée** : le micro du clavier du téléphone suffit, l'analyse comprend le langage parlé.
  - « deux litres de lait et du pain » → `lait 2 L`, `pain`
  - Nombres en lettres, articles (« du », « des », « un paquet de ») gérés.
- Unités élargies : `3 boîtes`, `1 paquet`, `2 bouteilles`…

### 5.5 Scan de code-barres
Un **raccourci facultatif** d'ajout, jamais une routine imposée.
- Bouton 📷 à côté du champ d'ajout.
- Cas d'usage visé : **à la maison, quand un paquet est fini**. Scan de l'emballage vide → l'article part dans la liste.
- Recherche du produit dans **Open Food Facts** (base publique gratuite, API sans clé).
- **Mémoire locale** : un code scanné est lié au produit canonique. Les scans suivants ne passent plus par Open Food Facts.
- Produit inconnu : on le nomme une fois, l'association est retenue.
- Nom affiché simplifié par défaut (« Nutella » plutôt que « Pâte à tartiner aux noisettes Nutella 400 g »), modifiable.
- Lecture du code : API native `BarcodeDetector` quand disponible (Chrome Android), sinon **zxing-wasm** (iPhone/Safari).

### 5.6 Mots pour l'autre
La liste sert aussi à se parler.
- Sur un article, une note peut être marquée **« pour toi »** : elle s'affiche en évidence chez l'autre (ex. « prends le bon, pas celui de la dernière fois 😄 »).
- Un **mot libre** en haut de la liste, visible par les deux (ex. « passe à la pharmacie aussi »).
- Les mots disparaissent avec « Courses terminées ».

### 5.7 Fin de courses
La fin est le moment dont on se souvient : elle est soignée.
- « Courses terminées » déclenche une **animation de célébration** et une phrase, tirées d'un répertoire varié (jamais deux fois de suite les mêmes).
- Les phrases peuvent s'appuyer sur la course du jour (« record de vitesse », « 3 articles ajoutés par Laeti pendant que tu étais au magasin »).
- Écran bref, refermable d'un tap.

### 5.8 Historique enrichi et favoris vivants
- **Recharger** une ancienne liste : remet ses articles dans la liste courante (doublons fusionnés comme en 4.4).
- **Décroissance des favoris** : un favori non acheté depuis 90 jours sort de l'écran Favoris (il reste proposé en autocomplétion et redevient favori au prochain achat). Un produit du pack de démarrage jamais acheté en 2 mois disparaît.

### 5.9 Écran « Coulisses »
Écran discret (accessible depuis Foyer) pour appliquer le critère des 3 mois sur des données.
- Pour chaque fonction : nombre d'utilisations, d'ignorances, dernière utilisation, tendance sur 3 mois.
- Fonctions en abandon gracieux signalées.
- Export CSV des données d'usage pour analyse libre.

---

## 6. V2 — La cuisine

### 6.1 Recettes
Chaque recette contient :
- Titre, photo (facultative), nombre de parts de base
- Ingrédients : produit canonique, quantité, unité
- Étapes de préparation numérotées
- Tags (voir 6.5)
- Temps de préparation et de cuisson (facultatifs)

**Ajustement des parts** : changer le nombre de convives recalcule les quantités proportionnellement.

### 6.2 Import depuis un lien
- Coller l'URL d'une recette → l'app récupère titre, photo, parts, ingrédients et étapes.
- **Partage direct** (Android) : depuis le navigateur, « Partager → Panier » importe la recette sans copier-coller. Sur iPhone, on colle le lien.
- S'appuie sur les données structurées schema.org (format `Recipe`) publiées par la plupart des sites (Marmiton, 750g, Cuisine AZ, etc.).
- Les ingrédients sont rattachés aux produits canoniques existants quand c'est possible.
- Résultat présenté en **brouillon modifiable** avant enregistrement.
- En cas d'échec : message clair et passage en saisie manuelle pré-remplie avec ce qui a pu être récupéré.

### 6.3 Planning de la semaine
- Grille **lundi → dimanche**, créneaux **midi** et **soir**.
- Chaque créneau : une recette (ou une note libre, ex. « resto », « restes »), un nombre de parts et un **cuisinier** (Damien / Laeti / les deux).
- Valeurs par défaut : **parts = 2**, **cuisinier = celui qui planifie**. Modifiables, jamais demandées.
- Créneaux vides autorisés : rien n'oblige à planifier toute la semaine.
- **Remplissage rapide** :
  - « Copier la semaine dernière » en un tap
  - « La roue remplit la semaine » : tirage pour tous les créneaux vides, chaque proposition acceptée ou relancée d'un tap
- Navigation entre semaines.
- **« Envoyer à la liste »** : ajoute les ingrédients des repas de la semaine à la liste de courses, quantités ajustées aux parts. Doublons fusionnés comme en 4.4, avec un bandeau groupé (« 3 ingrédients fusionnés — Voir »).

### 6.4 Roue des menus
- Bouton qui fait tourner une roue animée et tire une recette au hasard.
- **Filtres facultatifs** avant de lancer : par tag, exclure les recettes déjà au planning de la semaine, exclure les recettes cuisinées dans les 14 derniers jours.
- La recette tirée peut être placée directement dans un créneau du planning.

### 6.5 Tags
- Tags de base : `rapide`, `veggie`, `batch cooking`, `réconfort`.
- **Tags sport** : `veille de course`, `récup`, `post-sortie longue`.
- Tags personnalisés libres.

### 6.6 Mode cuisine
- Écran qui **reste allumé** (Wake Lock API).
- Une étape à la fois, en gros caractères, navigation par grands boutons.
- **Minuteurs intégrés** : si une étape mentionne une durée (« 20 min »), un bouton lance le minuteur correspondant. Plusieurs minuteurs simultanés possibles.
- Liste des ingrédients accessible à tout moment.

### 6.7 Notes à deux
- Note en **3 emojis** : 😋 / 😐 / 🤢, chacun de son côté.
- Proposée **une seule fois, à l'ouverture de l'app le lendemain** du repas (« Hier : chili. Alors ? »), ou en fin de mode cuisine. Ignorée = pas de note, aucune relance.
- Abandon gracieux : ignorée 5 fois de suite, elle ne se propose plus (toujours accessible depuis la fiche recette).
- Affichage des deux notes côte à côte.
- Badge **« Désaccord culinaire »** quand l'un met 😋 et l'autre 🤢.
- Tri des recettes possible par note.

### 6.8 Accueil contextuel
L'app ouvre sur ce qui compte à cet instant, sans rien à chercher.

| Moment | Écran d'accueil |
|---|---|
| Courses en cours (article coché il y a moins d'1 h) | La liste |
| En fin d'après-midi, un repas est planifié ce soir | Le repas du soir, son cuisinier, les ingrédients manquants (« il manque la crème → ajouter ») |
| Veille de courses habituelle (déduite de l'historique) | La liste, avec les suggestions |
| Sinon | La liste |

- Règles fixes et prévisibles, pas de magie : un bouton ramène toujours à la liste.
- Les créneaux horaires sont déduits de vos habitudes (heure habituelle des courses, des repas).

### 6.9 Le carnet qui se remplit tout seul
- Une **note libre** qui revient au moins 3 fois en 2 mois dans le planning (« pâtes carbo ») déclenche une proposition unique :
  > « Pâtes carbo revient souvent. L'enregistrer comme recette ? »
- Si oui : ébauche créée avec les produits les plus souvent achetés la veille de ce repas, à valider ou compléter. Étapes facultatives.
- Si ignorée : plus jamais proposée pour ce plat.

---

## 7. V3 — Intelligence et fun

### 7.1 Stock déduit
Pas d'inventaire à tenir : le stock est **estimé** par l'app.
- Un produit acheté récemment (dans sa durée de consommation habituelle, cf. 7.3) est considéré **probablement à la maison**.
- **Seule action utilisateur** : un tap « plus de… » (ex. « plus de beurre ») qui retire le produit du stock estimé et l'ajoute directement à la liste.
- Lors de l'envoi du planning à la liste, les ingrédients probablement en stock sont **signalés** (« Riz : sûrement en stock »), pas retirés d'office.
- Écran « À la maison » consultable, sans obligation de mise à jour.
- Après une pause détectée (§1), l'estimation repart de zéro.

### 7.2 Mode anti-restes
- Sélectionner un ou plusieurs produits (depuis le stock estimé, les favoris ou en saisie libre).
- L'app propose les recettes enregistrées qui les utilisent, classées par nombre d'ingrédients correspondants.

### 7.3 « À racheter bientôt »
- L'app calcule la fréquence d'achat moyenne de chaque produit à partir de l'historique.
- Quand un produit dépasse son délai habituel, il apparaît dans un bandeau de suggestions (3 au maximum à la fois) :
  > « Ça fait 15 jours : café ? »
- Ajout en un tap, ou « pas besoin » pour masquer jusqu'au prochain cycle.
- Activé à partir de 3 achats d'un même produit.
- Mis en veille pendant une pause, recalibré au retour.

### 7.4 « Comme d'habitude »
- Bouton qui propose le **panier type**, déduit de l'historique (produits présents dans la majorité des courses récentes du même type, ex. grosses courses du samedi).
- Un tap remplit la liste ; on retire ce qui ne sert pas.
- Activé après 5 courses.

### 7.5 Listes thématiques
- Listes modèles : apéro, barbecue, vacances, pique-nique… (créées librement, ou à partir d'une course passée de l'historique).
- **« Vider dans la liste »** : ajoute tous les articles du modèle à la liste courante, doublons fusionnés comme en 4.4.

### 7.6 Budget mensuel
Le montant du ticket est la **seule saisie manuelle volontairement conservée** : c'est elle qui fait prendre conscience de la dépense (cf. §12, suivi semi-automatique). Tout le reste est calculé.
- Enveloppe mensuelle définie par le foyer.
- Après « Courses terminées », un **pavé numérique s'ouvre directement** pour le montant du ticket, avec un bouton « passer » bien visible.
- Magasin facultatif, proposé parmi les derniers utilisés (un tap).
- Une course sans montant reste valide : le budget affiche alors « estimation partielle », sans reproche.
- Abandon gracieux : pas de montant lors des 6 dernières courses → le pavé ne s'ouvre plus automatiquement (bouton discret « ajouter un montant » à la place).
- **Jauge colorée** : vert → orange (80 %) → rouge (100 %).
- Historique des dépenses mois par mois.

### 7.7 Journal des repas
- Ce que vous avez réellement mangé, jour par jour.
- **Rempli automatiquement depuis le planning.** Le silence vaut validation : un repas non corrigé est considéré comme mangé.
- Correction en un tap si le plan a changé (« resto », « restes », autre recette).
- Photo facultative.

### 7.8 Stats du foyer
- Produit le plus acheté
- Recette la plus cuisinée
- Évolution des dépenses
- Répartition des cuisiniers
- Recettes les mieux notées / plus grands désaccords
- Les périodes de pause sont affichées en neutre, jamais comme des manques.

### 7.9 Récap du mois
- Carte façon « Wrapped », générée le 1er du mois pour le mois écoulé.
- Contenu : budget tenu ou non, recette star, produit le plus acheté, nombre de repas cuisinés par chacun, anecdotes (ex. « 12 kg de pâtes »).
- **Anecdotes tournantes** : tirées d'un large répertoire de formats, jamais les mêmes deux mois de suite.
- S'adapte aux données disponibles : un mois sans budget saisi donne un récap sans budget, sans le signaler.
- Visuel coloré, partageable en image.

### 7.10 Notification « Je pars faire les courses »
- Bouton qui envoie une notification à l'autre :
  > « Damien part faire les courses. Dernier appel ! »
- L'autre peut ajouter ses articles, qui apparaissent en temps réel.

### 7.11 Saisons et fêtes
La nouveauté arrive seule, sans que personne ne la crée.
- **Thèmes visuels saisonniers** automatiques : couleurs, icônes et animations de fin de courses changent avec les saisons et les fêtes.
- **Calendrier intégré** : Saint-Nicolas (début décembre), Noël, Chandeleur, Pâques, premiers beaux jours (barbecue), saison raclette en hiver, etc.
- **Fruits et légumes de saison** : la roue des menus peut favoriser les recettes de saison (filtre facultatif), et un bandeau discret indique ce qui est de saison ce mois-ci.
- **Suggestions de listes thématiques** à l'approche d'une fête (« Saint-Nicolas dans 5 jours : liste spéciale ? »), proposées une seule fois.
- Désactivable globalement.

---

## 8. Écrans

Navigation par barre d'onglets en bas de l'écran :

| Onglet | Contenu | Version |
|---|---|---|
| 🛒 **Liste** | Liste courante, champ d'ajout, « Courses terminées » ; puis mot pour l'autre, « pas urgent », suggestions, « comme d'habitude », bouton « je pars » | V0 (+V1, V3) |
| ⭐ **Favoris** | Catalogue ; puis listes thématiques | V0 (+V3) |
| 📅 **Semaine** | Planning, roue des menus | V2 |
| 📖 **Recettes** | Carnet, import, mode cuisine ; puis anti-restes | V2 (+V3) |
| 📊 **Foyer** | Historique, sauvegarde ; puis Coulisses ; puis stock estimé, budget, journal, stats, récap | V0 (+V1, V3) |

En V0, seuls les onglets Liste, Favoris et Foyer sont présents.

---

## 9. Style visuel et ergonomie

- **Coloré et rond** : coins très arrondis, couleurs vives, ombres douces.
- **Zone du pouce** : actions fréquentes (ajout, cochage, « Courses terminées ») dans le bas de l'écran.
- **Gros boutons** et cibles tactiles d'au moins 48 px.
- **Choix limités** : jamais plus de 3 à 5 suggestions affichées à la fois.
- **Icônes d'aliments** associées aux produits (emoji ou jeu d'icônes).
- Pastilles de couleur distinctes pour Damien et Laeti.
- Micro-animations : cochage satisfaisant (dès la V0), roue qui tourne, fin de courses, apparition du récap. Répertoire varié pour éviter la lassitude.
- Thème clair et sombre.

---

## 10. Modèle de données (Supabase)

Principe : tout ce qui s'achète est rattaché à un **produit canonique**. Liste, historique, ingrédients, codes-barres et manques pointent vers `produits`, ce qui rend fiables les fréquences, le stock déduit et les stats.

```
-- V0
profils           id, prenom, couleur   -- deux lignes fixes : Damien, Laeti
produits          id, nom, nom_normalise, icone, est_favori, favori_auto (bool),
                  quantite_defaut, unite_defaut, note_defaut, issu_du_pack (bool),
                  dernier_achat, rang_passage
produits_alias    alias_normalise, produit_id   -- « tomates », « Tomate » → tomate
articles_liste    id, produit_id, quantite, unite, note, ajoute_par, coche, coche_par, coche_le, cree_le
courses           id, date, montant, magasin, fait_par
courses_articles  id, course_id, produit_id, quantite, unite, ordre_cochage
usage_fonctions   id, profil_id, fonction, evenement (utilisee|ignoree), cree_le

-- V1
articles_liste    + note_pour_autre (bool), pas_urgent (bool)
mot_liste         id, texte, auteur, cree_le
codes_barres      code, produit_id, nom_off   -- un produit peut avoir plusieurs codes (marques différentes)

-- V2
recettes          id, titre, photo_url, parts, temps_prep, temps_cuisson, source_url, cree_par
ingredients       id, recette_id, produit_id, quantite, unite, ordre
etapes            id, recette_id, ordre, texte, duree_minutes
tags              id, nom, categorie
recettes_tags     recette_id, tag_id
notes_recettes    recette_id, profil_id, note (miam|bof|beurk)
planning          id, date, creneau (midi|soir), recette_id, note_libre, parts, cuisinier
propositions      id, type, cle, statut (proposee|acceptee|refusee)   -- propositions uniques jamais répétées

-- V3
manques           id, produit_id, signale_par, signale_le   -- « plus de… » ; le stock est calculé depuis courses_articles
listes_modeles    id, nom, icone
modeles_articles  id, liste_modele_id, produit_id, quantite, unite
journal_repas     id, date, creneau, recette_id, texte_libre, photo_url
budget            id, mois, montant_enveloppe
pauses            id, debut, fin   -- détectées automatiquement
```

Sécurité : **risque accepté**. Le dépôt est public (requis par GitHub Pages gratuit) et la clé publique Supabase figure dans le code de la page. Toute personne disposant du lien ou consultant le dépôt peut lire et modifier les données. Choix assumé pour une liste de courses ; la sauvegarde hebdomadaire (4.6) permet de restaurer en cas de souci. Évolution possible plus tard : lien secret ou code du foyer.

---

## 11. Points ouverts

- **Ordre de passage et plusieurs magasins (V1)** : si vous alternez entre magasins (France / Luxembourg), les ordres appris se mélangent. Options : un tap « je suis chez… » au premier cochage, un ordre unique robuste au mélange, ou abandon de la fonction.
- Montant de l'enveloppe budget (dépenses en France et au Luxembourg, tout en euros).
- Seuils à ajuster à l'usage (via l'écran Coulisses) : pause (10 jours), abandon gracieux (5 ou 6 ignorés), activation des suggestions (3 et 5 courses), décroissance des favoris (90 jours).

---

## 12. Fondements

Les choix de conception s'appuient sur la recherche en IHM et en psychologie :

| Principe | Source | Application |
|---|---|---|
| Les pauses font partie de l'usage ; il faut concevoir la reprise | Epstein et al., *A Lived Informatics Model of Personal Informatics* (2015) | Reprise sans rattrapage, détection des pauses |
| Le coût de saisie est une cause majeure d'abandon | Epstein et al., *Beyond Abandonment to Next Steps* (2016) | Règle d'or zéro friction |
| Accompagner ceux qui arrêtent (« happy abandonment ») | Clawson et al. (2015) | Abandon gracieux |
| Le suivi semi-automatique équilibre effort et prise de conscience | Choe et al., *Semi-Automated Tracking* (2017) | Seul le montant du ticket reste manuel |
| La liste de courses sert aussi à communiquer dans le foyer | Heinrichs et al., étude de terrain sur les listes papier (DFKI) | Mots pour l'autre |
| Adaptation hédonique : le plaisir s'émousse avec la répétition | Psychologie hédonique (Brickman & Campbell, Frederick & Loewenstein) | Répertoires tournants |
| Règle pic-fin : on retient le pic et la fin d'une expérience | Kahneman et al. (1993) | Fin de courses soignée |
| Effet de gradient d'objectif : on accélère près du but | Kivetz et al. (2006) | Barre de progression en magasin |
| Loi de Fitts et zone du pouce | Fitts (1954), Hoober (2013) | Actions fréquentes en bas, grosses cibles |
| Loi de Hick : plus de choix = décision plus lente | Hick (1952) | 3 à 5 suggestions maximum |
| Reconnaissance plutôt que rappel | Heuristiques de Nielsen (1994) | Suggestions et favoris avant la saisie libre |
| Découvrabilité : les gestes cachés ne sont pas trouvés | Heuristiques de Nielsen (visibilité) | Chaque geste a un équivalent visible |
| Effet des valeurs par défaut | Johnson & Goldstein (2003) | Défauts intelligents partout, fusion des doublons par défaut |
