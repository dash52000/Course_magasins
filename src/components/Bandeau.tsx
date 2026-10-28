export interface Message {
  texte: string;
  actions?: Array<{ libelle: string; faire: () => void }>;
  duree?: number;
  /** Appelé si le bandeau s'efface sans qu'aucune action ait été choisie. */
  siIgnore?: () => void;
}

export function Bandeau({ message, onFermer }: { message: Message; onFermer: () => void }) {
  return (
    <div className="bandeau" role="status" aria-live="polite">
      <span className="bandeau-texte">{message.texte}</span>
      {message.actions?.map((a) => (
        <button
          key={a.libelle}
          className="bandeau-action"
          onClick={() => {
            onFermer();
            a.faire();
          }}
        >
          {a.libelle}
        </button>
      ))}
    </div>
  );
}
