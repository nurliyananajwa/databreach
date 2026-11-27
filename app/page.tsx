import IncidentLanding from "@/components/landing/IncidentLanding";
import "@fontsource-variable/manrope/wght.css";
import "@fontsource-variable/fraunces/wght.css";
import "@/components/landing/incident-landing.css";

export const metadata = { title: "Breachfolio", openGraph: { title: "Breachfolio" } };

export default function LandingPage() {
  return <IncidentLanding />;
}
