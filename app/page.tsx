import IncidentLanding from "@/components/landing/IncidentLanding";
import "@fontsource-variable/manrope/wght.css";
import "@fontsource-variable/fraunces/wght.css";
import "@/components/landing/incident-landing.css";

export const metadata = { title: "Data Breach System", openGraph: { title: "Data Breach System" } };

export default function LandingPage() {
  return <IncidentLanding />;
}
