// Trois bulles d'aide au tout premier lancement (mémorisées dans ce navigateur).
import { useState } from 'react';
import { Button } from './common';

const SEEN_KEY = 'syndicate-of-odds-hints-seen';

const HINTS = [
  { title: 'Ton Équipe joue toute seule', text: "À la Table, ton Flambeur rafle la Caisse du Casino et gagne du Cash et de la Réputation, même quand tu fermes l'onglet." },
  { title: 'Recrute au QG', text: 'Le Bureau de recrutement propose des Candidats. Embauche-les, puis place-les dans ton Équipe depuis le Syndicat.' },
  { title: 'Dépense tes points de Talent', text: 'Chaque niveau donne un point de Talent. Ouvre la fiche d’un Joueur (badge doré « +1 ») pour choisir sa voie.' },
];

function alreadySeen(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return true;
  }
}

export function FirstSteps() {
  const [step, setStep] = useState(() => (alreadySeen() ? HINTS.length : 0));
  const hint = HINTS[step];
  if (!hint) return null;

  const next = () => {
    if (step === HINTS.length - 1) {
      try {
        localStorage.setItem(SEEN_KEY, '1');
      } catch {
        // Navigation privée : les bulles reviendront, ce n'est pas grave.
      }
    }
    setStep(step + 1);
  };

  return (
    <aside className="fixed bottom-20 right-4 z-30 max-w-xs rounded-lg border border-gold bg-smoke p-3 shadow-xl lg:bottom-6">
      <p className="text-[10px] uppercase tracking-widest text-stone-500">
        Premiers pas · {step + 1}/{HINTS.length}
      </p>
      <h3 className="font-semibold text-gold">{hint.title}</h3>
      <p className="mt-1 text-xs text-stone-300">{hint.text}</p>
      <div className="mt-2 text-right">
        <Button variant="gold" onClick={next}>
          {step === HINTS.length - 1 ? 'Compris' : 'Suivant'}
        </Button>
      </div>
    </aside>
  );
}
