import LoadingState from "./LoadingState.jsx";

export default function AppLoader({ label = "Loading your page..." }) {
  return <LoadingState variant="page" label={label} className="bg-background" />;
}
