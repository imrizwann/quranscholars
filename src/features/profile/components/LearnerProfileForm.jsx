import { useRef, useState } from "react";
import AsyncButton from "@/components/ui/AsyncButton.jsx";
import SelectField from "@/components/ui/SelectField.jsx";
import LoadingState from "@/components/feedback/LoadingState.jsx";
import { useGetLearnerProfileQuery, useUpdateLearnerProfileMutation } from "@/services/api/user/learnerApi.js";
import { userMessage } from "@/lib/user-messages.js";

const genderOptions = [
  { value: "not_provided", label: "Not provided" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];
const textFields = [
  { name: "city", label: "City", autoComplete: "address-level2", maxLength: 100 },
  { name: "state", label: "State or region", autoComplete: "address-level1", maxLength: 100 },
  { name: "country", label: "Country", autoComplete: "country-name", maxLength: 100 },
  { name: "preferredLanguage", label: "Preferred language", autoComplete: "language", maxLength: 60 },
];

export default function LearnerProfileForm() {
  const profile = useGetLearnerProfileQuery(undefined, { refetchOnMountOrArgChange: true });
  const [save, saving] = useUpdateLearnerProfileMutation();
  // Preserve unsaved edits if a background request updates the query cache.
  const [edits, setEdits] = useState({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const lock = useRef(false);
  const values = { ...profile.currentData, ...edits };
  const dirty = Object.keys(edits).some(key => (edits[key] || "") !== (profile.currentData?.[key] || ""));
  const change = (key, value) => { setEdits(previous => ({ ...previous, [key]: value })); setMessage(""); setError(""); };
  async function submit(event) {
    event.preventDefault();
    if (lock.current || !dirty || !profile.currentData || profile.error) return;
    lock.current = true;
    setError(""); setMessage("");
    try {
      const changes = Object.fromEntries(Object.entries(edits).map(([key, value]) => [key, value?.trim() || null]));
      const result = await save(changes).unwrap();
      // Keep the returned values visible while the invalidated GET refetches.
      setEdits(Object.fromEntries(["gender", ...textFields.map(field => field.name)].map(key => [key, result[key] ?? ""])));
      setMessage("Your learning profile has been updated.");
    } catch (failure) { setError(userMessage(failure, "We could not save your details. Please try again.")); }
    finally { lock.current = false; }
  }
  return <section className="public-panel" aria-labelledby="learner-profile-title">
    <h2 id="learner-profile-title">Learning profile</h2>
    <p className="profile-section-description">These details are optional. You can enroll in courses without completing them.</p>
    {profile.isLoading && <LoadingState variant="inline" label="Loading your details" />}
    {profile.error && <div className="profile-feedback profile-feedback-error" role="alert"><p>{userMessage(profile.error)}</p><AsyncButton className="cw-button" loading={profile.isFetching} loadingLabel="Loading details" onClick={profile.refetch}>Try again</AsyncButton></div>}
    {profile.currentData && <form onSubmit={submit} aria-busy={saving.isLoading || undefined}>
      <fieldset className="profile-preferences" disabled={saving.isLoading || Boolean(profile.error)}>
        <legend className="sr-only">Optional learning profile details</legend>
        <SelectField id="learner-gender" name="gender" label="Gender" options={genderOptions} value={values.gender || "not_provided"} onChange={value => change("gender", value === "not_provided" ? "" : value)} disabled={saving.isLoading || Boolean(profile.error)} />
        {textFields.map(({ label, ...field }) => <label key={field.name} className="profile-field" htmlFor={`learner-${field.name}`}>{label}<input {...field} id={`learner-${field.name}`} className="profile-input" value={values[field.name] || ""} onChange={event => change(field.name, event.target.value)} /></label>)}
      </fieldset>
      <div className="profile-actions"><AsyncButton type="submit" className="cw-button cw-primary" loading={saving.isLoading} loadingLabel="Saving details" disabled={!dirty || profile.isFetching || Boolean(profile.error)}>Save details</AsyncButton>{dirty && <button type="button" className="cw-button" disabled={saving.isLoading} onClick={() => { setEdits({}); setError(""); setMessage(""); }}>Cancel</button>}</div>
    </form>}
    {error && <p className="profile-feedback profile-feedback-error" role="alert">{error}</p>}
    {message && <p className="profile-feedback" role="status">{message}</p>}
  </section>;
}
