# Drosophila!

Allevamento virtuale di moscerini della frutta per esercitarsi con la mappatura genetica degli eucarioti.
È la versione web dei programmi Python/pygame del Capitolo 4 (*Nuovo Genoma*, *Esperimento* e *Soluzione*), riunita in un'unica app che funziona nel browser, sia da computer sia da smartphone.

## Come si gioca

Un genoma segreto distribuisce 9 geni su 2 coppie di cromosomi. Ogni gene controlla un carattere, con un allele dominante e uno recessivo.

1. **Allevamento**: si parte dal tipo selvatico #0 e da due mutanti. Ogni moscerino si può far mutare o eliminare; il selvatico non si può eliminare.
2. **Incrocio**: si scelgono due genitori (anche lo stesso, per l'autoincrocio). Ci sono due modi:
   - *8 figli a caso*: si vedono 8 figli con tutti i caratteri e si possono aggiungere all'allevamento;
   - *Conta i caratteri*: si scelgono da 1 a 3 caratteri e si ottengono circa 250 figli, contati per fenotipo.
3. **Quaderno**: conserva lo storico degli incroci, con le note, e la propria ipotesi di mappa, da confrontare alla fine con la soluzione.
4. **Strumenti**: test del χ² e distanza di mappa con la funzione di Haldane, da usare quando servono.

### Partita cooperativa

Con *Partita cooperativa* l'insegnante genera un codice, partendo da un genoma casuale oppure scegliendo cromosoma e posizione di ogni gene. Ogni studente lo inserisce in *Entra con il codice* e lavora sullo stesso genoma.
I progressi vengono salvati automaticamente nel browser di ciascuno.

## Pubblicare con GitHub Pages

1. Crea un nuovo repository su GitHub e caricaci **il contenuto** di questa cartella: `index.html` deve stare nella radice del repository.
2. Nel repository apri **Settings → Pages**.
3. In *Build and deployment* scegli *Deploy from a branch*, poi il branch `main` e la cartella `/ (root)`, e salva.
4. Dopo circa un minuto l'app è online all'indirizzo `https://<tuo-utente>.github.io/<nome-repository>/`.

Per provarla sul tuo computer basta aprire `index.html` nel browser.

## Struttura

```
index.html        pagina principale
css/style.css     grafica
js/engine.js      motore genetico (crossing-over, incroci, mutazioni, codici partita, χ², Haldane)
js/app.js         interfaccia (schermate, tocchi, salvataggio)
img/              livelli del disegno del moscerino
```

## Parametri

Si trovano in cima a `js/engine.js`:

| Costante   | Valore | Significato                                     |
|------------|-------:|-------------------------------------------------|
| `MUT_INIT` |    0,1 | tasso di mutazione dei mutanti iniziali         |
| `MUT`      |    0,2 | tasso di mutazione durante il gioco             |
| `AVG`      |    250 | numero medio di figli nei conteggi (±20%)       |
| `PREVIEW`  |      8 | figli mostrati in anteprima                     |
| `N_INIT`   |      2 | mutanti presenti all'inizio                     |

Il modello genetico è lo stesso dell'originale: crossing-over in numero distribuito secondo Poisson(1), in punti uniformi del cromosoma, con le mutazioni che portano gli alleli al recessivo.
Le posizioni sono espresse in cM, da 0 a 100.

Autore: Davide Palmigiani
