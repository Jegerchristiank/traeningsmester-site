import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  formatWeight,
  useBenchSession,
  type BenchHistory,
} from "../benchSession";
import BenchSetRow from "./BenchSetRow";
import "../workout-story.css";

const product = "/product/";
const dateFormat = new Intl.DateTimeFormat("da-DK", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function dateGroups(history: BenchHistory[]) {
  const groups = new Map<string, BenchHistory["sets"]>();
  for (const workout of history) {
    const date =
      workout.completedAt === null
        ? "Forrige eksempeltræning"
        : dateFormat.format(workout.completedAt);
    groups.set(date, [...(groups.get(date) || []), ...workout.sets]);
  }
  return Array.from(groups);
}

function HistoryIcon() {
  return (
    <svg
      aria-hidden="true"
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 5v5h5" />
      <path d="M3.4 9.5a8.7 8.7 0 1 1 .15 5.4M12 7v5l3 2" />
    </svg>
  );
}

function ExercisePlate({
  ready,
  resting,
}: {
  ready: boolean;
  resting: boolean;
}) {
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const stop = () => setPlaying(false);
    preference.addEventListener("change", stop);
    return () => preference.removeEventListener("change", stop);
  }, []);
  return (
    <div className="bench-plate" id="dit-program">
      <div className="bench-context">
        <span>Overkrop A</span>
        <span>Eksempeltræning</span>
      </div>
      <h2 id="workout-story-heading">
        Bænkpres <span>med stang.</span>
      </h2>
      <figure className="bench-motion">
        <img
          width="512"
          height="512"
          loading="lazy"
          decoding="async"
          src={
            product + (playing ? "baenkpres-bevaegelse.webp" : "baenkpres.webp")
          }
          alt="Bænkpres med stang på flad bænk fra Træningsmesters øvelsesbibliotek."
        />
        <button
          type="button"
          className="bench-motion-button"
          aria-pressed={playing}
          disabled={!ready}
          onClick={() => setPlaying(!playing)}
        >
          <span
            aria-hidden="true"
            className={playing ? "bench-pause-icon" : "bench-play-icon"}
          />
          {playing ? "Pause bevægelsen" : "Vis bevægelsen"}
        </button>
      </figure>
      <dl className="bench-plan" aria-label="Planen for bænkpres">
        <div>
          <dt>Arbejdssæt</dt>
          <dd>3</dd>
        </div>
        <div>
          <dt>Gentagelser</dt>
          <dd>8</dd>
        </div>
        <div id={resting ? undefined : "din-pause"}>
          <dt>Pause</dt>
          <dd>2:00</dd>
        </div>
      </dl>
    </div>
  );
}

export default function WorkoutStory({
  accessLink,
}: {
  accessLink: ReactNode;
}) {
  const {
    session,
    ready,
    remaining,
    setDraft,
    saveSet,
    uncheckSet,
    skipRest,
    finish,
    nextWorkout,
  } = useBenchSession();
  const historyDialog = useRef<HTMLDialogElement>(null);
  const finishDialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const returnFocus = useRef(false);
  const historyTrigger = useRef<HTMLButtonElement>(null);
  const [message, setMessage] = useState("");
  const [revealErrors, setRevealErrors] = useState(false);
  const count = session.rows.filter((row) => row.saved !== null).length;
  const next = session.rows.findIndex((row) => !row.saved);
  const finished = session.phase === "finished";
  const previous = session.history[0].sets.at(-1)!;

  useEffect(() => {
    function followFragment() {
      if (
        window.location.hash === "#din-historik" &&
        !historyDialog.current?.open
      ) {
        historyDialog.current?.showModal();
      } else if (
        window.location.hash !== "#din-historik" &&
        historyDialog.current?.open
      ) {
        historyDialog.current.close();
      }
    }
    followFragment();
    window.addEventListener("hashchange", followFragment);
    return () => window.removeEventListener("hashchange", followFragment);
  }, []);

  useEffect(() => {
    if (returnFocus.current) {
      returnFocus.current = false;
      heading.current?.focus({ preventScroll: true });
    }
  }, [finished]);

  function commitFinish() {
    finishDialog.current?.close();
    if (finish()) {
      returnFocus.current = true;
      setMessage("Eksempeltræningen er afsluttet.");
    } else {
      setRevealErrors(true);
      setMessage("Kontrollér tallene i de registrerede sæt.");
    }
  }

  function openHistory() {
    if (!historyDialog.current?.open) historyDialog.current?.showModal();
  }

  function closeHistory() {
    if (window.location.hash === "#din-historik") {
      window.history.replaceState(window.history.state, "", "#baenkpres-log");
    }
    historyTrigger.current?.focus({ preventScroll: true });
  }

  return (
    <section
      id="baenkpres-log"
      className="workout-story"
      aria-labelledby="workout-story-heading"
      tabIndex={-1}
    >
      <div className="bench-spread">
        <ExercisePlate ready={ready} resting={!finished && remaining > 0} />
        <div className="bench-desk" id="dit-saet">
          <span
            id="din-historik"
            className="bench-history-anchor"
            aria-hidden="true"
          />
          <div className="bench-interactive">
            <header className="bench-toolbar">
              <h3 ref={heading} tabIndex={-1}>
                {finished ? "Træning afsluttet." : "Arbejdssæt"}
              </h3>
              {!finished && (
                <button
                  ref={historyTrigger}
                  type="button"
                  className="bench-history-link"
                  disabled={!ready}
                  onClick={openHistory}
                >
                  <HistoryIcon /> Tidligere
                </button>
              )}
            </header>
            {finished ? (
              <div className="bench-summary">
                <p>
                  Du registrerede {count === 1 ? "ét sæt" : `${count} sæt`} i
                  bænkpres. Næste gang finder du tallene under Tidligere.
                </p>
                <ol className="bench-results" aria-label="Registrerede sæt">
                  {session.rows.map(
                    (row, i) =>
                      row.saved && (
                        <li key={i}>
                          <span>Sæt {i + 1}</span>
                          <strong>
                            {formatWeight(row.saved.weight)} kg ×{" "}
                            {row.saved.reps}
                          </strong>
                        </li>
                      ),
                  )}
                </ol>
                <button
                  type="button"
                  className="bench-primary"
                  onClick={() => {
                    returnFocus.current = true;
                    setRevealErrors(false);
                    setMessage("");
                    nextWorkout();
                  }}
                >
                  Start næste træning <span aria-hidden="true">→</span>
                </button>
                {accessLink}
              </div>
            ) : (
              <>
                <div className="bench-previous">
                  <span>Sidste sæt</span>
                  <strong>
                    {formatWeight(previous.weight)} <small>kg</small> <i>×</i>{" "}
                    {previous.reps}
                  </strong>
                </div>
                <div
                  className="bench-columns bench-row-grid"
                  aria-hidden="true"
                >
                  <span>Sæt</span>
                  <span>Gentagelser</span>
                  <span>Kg</span>
                  <span>Udført</span>
                </div>
                <ol className="bench-rows" aria-label="Arbejdssæt for bænkpres">
                  {session.rows.map((row, index) => (
                    <BenchSetRow
                      key={index}
                      row={row}
                      index={index}
                      active={index === next}
                      revealErrors={revealErrors}
                      ready={ready}
                      edit={setDraft}
                      save={saveSet}
                      uncheck={uncheckSet}
                      announce={setMessage}
                    />
                  ))}
                </ol>
                <div className="bench-feedback">
                  {remaining > 0 ? (
                    <div className="bench-rest" id="din-pause">
                      <img
                        width="42"
                        height="48"
                        src={product + "saetpause.webp"}
                        alt=""
                      />
                      <div>
                        <span>Pausetid mellem sæt</span>
                        <strong role="timer">
                          {Math.floor(remaining / 60)
                            .toString()
                            .padStart(2, "0")}
                          :{(remaining % 60).toString().padStart(2, "0")}
                        </strong>
                      </div>
                      <button
                        type="button"
                        className="bench-cancel"
                        aria-label="Annuller pausetid mellem sæt"
                        onClick={skipRest}
                      >
                        −
                      </button>
                      <div className="bench-rest-track" aria-hidden="true">
                        <span
                          style={{ width: `${(remaining / 120) * 100}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="bench-hint">
                      {count === 0
                        ? "Tilpas tallene, og tryk på cirklen, når sættet er udført."
                        : count === 3
                          ? "Alle tre sæt er registreret."
                          : "Næste sæt er klar, når du er."}
                    </p>
                  )}
                </div>
                <footer className="bench-workout-footer">
                  <span>
                    <span className="bench-tally" aria-hidden="true">
                      {session.rows.map((row, i) => (
                        <i key={i} data-done={row.saved ? "" : undefined} />
                      ))}
                    </span>
                    {count} af 3 udført
                  </span>
                  {count > 0 && (
                    <button
                      type="button"
                      className="bench-end"
                      onClick={() => {
                        if (count < session.rows.length)
                          finishDialog.current?.showModal();
                        else commitFinish();
                      }}
                    >
                      Afslut træning <span aria-hidden="true">→</span>
                    </button>
                  )}
                </footer>
              </>
            )}
          </div>
          <noscript>
            <style>
              {
                ".bench-interactive,.bench-motion-button{display:none!important}"
              }
            </style>
            <div className="bench-static">
              <h3>Fra sidste sæt til næste træning.</h3>
              <dl>
                <div>
                  <dt>Sidste sæt</dt>
                  <dd>60 kg × 8</dd>
                </div>
                <div>
                  <dt>Registreret sæt</dt>
                  <dd>62,5 kg × 8</dd>
                </div>
                <div>
                  <dt>Pause</dt>
                  <dd>2:00</dd>
                </div>
              </dl>
              <p>
                I næste træning viser Tidligere dit registrerede sæt. Slå
                JavaScript til for selv at prøve tallene.
              </p>
            </div>
          </noscript>
          <p className="mk-sr-only" role="status">
            {message}
          </p>
        </div>
      </div>
      <dialog
        ref={historyDialog}
        className="bench-dialog"
        aria-labelledby="bench-history-title"
        onClose={closeHistory}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            const box = e.currentTarget.getBoundingClientRect();
            if (
              e.clientX < box.left ||
              e.clientX > box.right ||
              e.clientY < box.top ||
              e.clientY > box.bottom
            )
              e.currentTarget.close();
          }
        }}
      >
        <div className="bench-dialog-head">
          <span>Bænkpres med stang</span>
          <button
            type="button"
            className="bench-close"
            aria-label="Luk historik"
            onClick={() => historyDialog.current?.close()}
          >
            ×
          </button>
        </div>
        <h3 id="bench-history-title">Seneste registreringer</h3>
        {dateGroups(session.history).map(([date, sets], index) => (
          <details key={date} open={index === 0} className="bench-history-day">
            <summary>
              <span>{date}</span>
              <small>{sets.length} sæt</small>
            </summary>
            <ul className="bench-results">
              {sets.map((set, i) => (
                <li key={i}>
                  <span>Sæt {set.number}</span>
                  <strong>
                    {formatWeight(set.weight)} kg × {set.reps} gent.
                  </strong>
                </li>
              ))}
            </ul>
          </details>
        ))}
      </dialog>
      <dialog
        ref={finishDialog}
        className="bench-dialog bench-confirm"
        aria-labelledby="bench-finish-title"
      >
        <h3 id="bench-finish-title">Afslut træning?</h3>
        <p>
          Du har registreret {count} af 3 sæt. De udførte sæt kommer med i din
          eksempelhistorik.
        </p>
        <div className="bench-dialog-actions">
          <button
            type="button"
            className="bench-secondary"
            onClick={() => finishDialog.current?.close()}
          >
            Fortsæt træning
          </button>
          <button
            type="button"
            className="bench-primary"
            onClick={commitFinish}
          >
            Afslut træning
          </button>
        </div>
      </dialog>
    </section>
  );
}
