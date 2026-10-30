import { useState } from "react";
import { Pencil } from "lucide-react";
import api from "@/services/api/instructor/recordedCoursesApi.js";
import AsyncButton from "@/components/ui/AsyncButton.jsx";
import { coursePrice } from "./course-price.js";
import { userMessage } from "@/lib/user-messages.js";

export default function CoursePricingEditor({ course, disabled, onBusy, onEditing }) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [update, { isLoading }] = api.endpoints.updatePricing.useMutation();
  const price = course.price || {};
  const format = value => `${price.currency || "INR"} ${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const close = () => { setEditing(false); onEditing(false); setError(""); };
  return <section className="cw-card"><div className="cw-row cw-between"><h2>Course pricing</h2>{!editing && <button className="cw-button cw-button-compact" type="button" disabled={disabled} onClick={() => { setEditing(true); setSaved(false); onEditing(true); }}><Pencil size={15} aria-hidden="true" />Edit pricing</button>}</div><p className="cw-muted">Choose a price that reflects your course. Changes apply to new purchases.</p>{saved && <p className="cw-notice" role="status">Pricing saved.</p>}
    {editing ? <form className="cw-stack" onSubmit={async event => {
      event.preventDefault(); if (isLoading) return;
      const form = new FormData(event.currentTarget); setError(""); onBusy(true);
      try { await update({ courseId: course._id, price: coursePrice(form.get("original"), form.get("sale")) }).unwrap(); close(); setSaved(true); }
      catch (failure) { setError(userMessage(failure)); }
      finally { onBusy(false); }
    }}><div className="cw-form-grid"><label>Original price ({price.currency || "INR"})<input type="number" name="original" min="0.01" step="0.01" max="10000000" required defaultValue={price.original} disabled={isLoading} /></label><label>Sale price (optional)<input type="number" name="sale" min="0" step="0.01" max="10000000" defaultValue={price.sale ?? ""} disabled={isLoading} /><span className="cw-field-hint">Leave blank to remove the discount.</span></label></div>{error && <p className="cw-error" role="alert">{error}</p>}<div className="cw-row"><AsyncButton className="cw-button cw-primary" type="submit" loading={isLoading}>Save pricing</AsyncButton><button type="button" className="cw-button" disabled={isLoading} onClick={close}>Cancel</button></div></form> : <dl className="cw-details-grid"><div><dt className="cw-muted">Original price</dt><dd>{format(price.original)}</dd></div><div><dt className="cw-muted">Sale price</dt><dd>{price.sale == null ? "No discount" : format(price.sale)}</dd></div><div><dt className="cw-muted">Learners pay</dt><dd>{format(price.sale ?? price.original)}</dd></div></dl>}
  </section>;
}
