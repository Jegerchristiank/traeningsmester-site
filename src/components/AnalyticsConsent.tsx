import { useState } from "react";
import {
  getMarketingAnalyticsConsent,
  marketingAnalyticsConfigured,
  setMarketingAnalyticsConsent,
} from "../marketingAnalytics";

export default function AnalyticsConsent() {
  const [allowed, setAllowed] = useState(getMarketingAnalyticsConsent);
  return (
    <details className="analytics-consent">
      <summary>Statistik</summary>
      <p>
        Valgfri statistik hjælper os med at forstå besøg, tilmeldingsforsøg og
        fejl. Vi bruger PostHog i EU uden skærmoptagelse, e-mailadresser eller
        træningsindhold.
      </p>
      <label>
        <input
          type="checkbox"
          checked={allowed}
          disabled={!marketingAnalyticsConfigured}
          onChange={(event) => {
            setAllowed(event.target.checked);
            setMarketingAnalyticsConsent(event.target.checked);
          }}
        />
        <span>Tillad anonymiseret statistik</span>
      </label>
      <p>
        Valget gælder kun statistik og kan ændres her. Det har ingen betydning
        for din tilmelding.
      </p>
      {!marketingAnalyticsConfigured && (
        <p>Statistik er ikke aktiveret i dette miljø.</p>
      )}
      <a href="/privatliv">Læs om privatliv</a>
    </details>
  );
}
