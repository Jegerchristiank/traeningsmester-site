import { useRef, useState } from "react";
import type { MouseEvent } from "react";
import filmUrl from "../../marketing/launch/traen-videre.mp4?url";
import { focusAccessForm } from "./AccessForm";

export default function WorkoutFilm() {
  const dialog = useRef<HTMLDialogElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);

  function closeFilm() {
    video.current?.pause();
    dialog.current?.close();
  }

  function play(event: MouseEvent<HTMLAnchorElement>) {
    const player = video.current;
    const viewer = dialog.current;
    if (
      !player ||
      !viewer?.showModal ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    event.preventDefault();
    event.currentTarget.focus({ preventScroll: true });
    viewer.showModal();
    setFailed(false);
    // Start the first media request inside the user gesture, including on iOS.
    if (!player.hasAttribute("src") || player.error) player.src = filmUrl;
    else player.currentTime = 0;
    void player.play().catch(() => {
      // The native controls also work when the browser requires a second tap.
    });
  }

  return (
    <>
      <a
        className="film-trigger"
        href="#traeningsforloeb"
        aria-haspopup="dialog"
        aria-controls="workout-film"
        onClick={play}
      >
        <span className="film-play" aria-hidden="true">
          <svg width="16" height="18" viewBox="0 0 16 18" fill="currentColor">
            <path d="M3 2.4c0-.8.8-1.2 1.5-.8l9 6.5a1.1 1.1 0 0 1 0 1.8l-9 6.5c-.7.4-1.5 0-1.5-.8z" />
          </svg>
        </span>
        <span className="film-label">
          <strong>
            Se bænkpres i appen <small>0:19</small>
          </strong>
          <span>Overkrop A · 60 → 62,5 kg × 8 · Eksempel</span>
        </span>
      </a>
      <dialog
        ref={dialog}
        id="workout-film"
        className="workout-film"
        aria-labelledby="film-title"
        onCancel={() => video.current?.pause()}
        onClose={() => {
          if (!dialog.current?.open) video.current?.pause();
        }}
        onClick={(event) => {
          if (event.target !== event.currentTarget) return;
          const { left, right, top, bottom } =
            event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < left ||
            event.clientX > right ||
            event.clientY < top ||
            event.clientY > bottom
          )
            closeFilm();
        }}
      >
        <div className="film-bar">
          <h2 id="film-title">Et sæt i Træningsmester</h2>
          <button
            className="film-close"
            aria-label="Luk filmen"
            onClick={closeFilm}
          >
            ×
          </button>
        </div>
        <video
          ref={video}
          controls
          playsInline
          preload="none"
          aria-label="Film med eksempeldata fra Overkrop A"
          aria-describedby="film-description"
          onError={() => setFailed(true)}
          hidden={failed}
        />
        <p className="mk-sr-only" id="film-description">
          Lydløs film. Sidst løftede du 60 kg otte gange i bænkpres. I Overkrop
          A registrerer du 62,5 kg otte gange. Pausen begynder, og næste gang
          finder du sættet i din historik.
        </p>
        {failed ? (
          <>
            <p className="film-error" role="status">
              Filmen kunne ikke afspilles.
            </p>
            <a
              className="film-action"
              href="#traeningsforloeb"
              onClick={closeFilm}
            >
              Se træningen trin for trin <span aria-hidden="true">↓</span>
            </a>
          </>
        ) : (
          <button
            className="film-action"
            type="button"
            aria-haspopup="dialog"
            aria-controls="access-dialog"
            onClick={() => {
              closeFilm();
              focusAccessForm();
            }}
          >
            Få besked om adgang <span aria-hidden="true">→</span>
          </button>
        )}
      </dialog>
    </>
  );
}
