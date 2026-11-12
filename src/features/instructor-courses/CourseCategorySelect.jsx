import { useId, useRef, useState } from "react";
import { Combobox } from "@base-ui/react/combobox";
import { Check, ChevronDown, Search } from "lucide-react";
import instructorCoursesApi from "@/services/api/instructor/recordedCoursesApi.js";
import useDebouncedValue from "@/hooks/useDebouncedValue.js";
import Spinner from "@/components/feedback/Spinner.jsx";
import { readableError } from "./courseApi.js";
import "@/components/ui/form-controls.css";

export default function CourseCategorySelect({ value, onChange, disabled = false, error }) {
  const id = useId();
  const input = useRef(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 250);
  const query = instructorCoursesApi.endpoints.getCategories.useQuery({ page: 1, limit: 50, search: debouncedSearch }, { skip: !open, refetchOnMountOrArgChange: true });
  const loading = query.isFetching || search !== debouncedSearch;
  const data = !query.isError && !loading ? query.currentData : null;
  const items = data?.items || [];
  const selected = typeof value === "string" ? { _id: value, name: "Current category" } : value || null;
  return <div className="qs-select-field">
    <label data-select-label id={`${id}-label`} htmlFor={id} className="mb-1.5 block text-sm font-semibold text-foreground">Category <span aria-hidden="true">*</span></label>
    <Combobox.Root id={id} name="category" items={items} value={selected} onValueChange={onChange} itemToStringLabel={item => item.name} itemToStringValue={item => item._id} isItemEqualToValue={(item, current) => item._id === current._id} filter={null} inputValue={search} onInputValueChange={setSearch} open={open} onOpenChange={next => { setOpen(next); if (!next) setSearch(""); }} disabled={disabled} required autoHighlight modal={false}>
      <Combobox.Trigger id={id} type="button" aria-labelledby={`${id}-label`} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} className="qs-select-trigger">
        <span className="min-w-0 truncate"><Combobox.Value>{current => current?.name || "Choose a category"}</Combobox.Value></span>
        <Combobox.Icon><ChevronDown size={16} aria-hidden="true" /></Combobox.Icon>
      </Combobox.Trigger>
      <Combobox.Portal><Combobox.Positioner sideOffset={6} align="start" className="qs-select-positioner">
        <Combobox.Popup initialFocus={input} className="qs-popup-motion qs-select-popup qs-category-popup">
          <div className="qs-category-search"><Search size={16} aria-hidden="true" /><Combobox.Input ref={input} id={`${id}-search`} name="category-search" aria-label="Search categories" placeholder="Search categories…" autoComplete="off" maxLength={80} /></div>
          <Combobox.List className="qs-select-list" aria-busy={loading}>
            {items.map(item => <Combobox.Item key={item._id} value={item} className="qs-select-option"><span className="min-w-0 flex-1 break-words">{item.name}</span><Combobox.ItemIndicator><Check size={16} className="text-primary" aria-hidden="true" /></Combobox.ItemIndicator></Combobox.Item>)}
          </Combobox.List>
          {loading ? <div className="qs-category-message" role="status"><Spinner size={16} label="Searching categories" />Searching categories…</div> : query.isError ? <div className="qs-category-message" role="alert"><p>{readableError(query.error)}</p><button type="button" className="cw-button cw-button-compact" onClick={query.refetch}>Try again</button></div> : !items.length ? <div className="qs-category-message" role="status">{search.trim() ? "No categories match your search." : "No active categories are available. Contact our team for help."}</div> : data?.pagination.hasNextPage ? <p className="qs-category-message">More categories are available. Search by name to narrow the list.</p> : null}
        </Combobox.Popup>
      </Combobox.Positioner></Combobox.Portal>
    </Combobox.Root>
    {error && <p id={`${id}-error`} role="alert" className="mt-1.5 text-sm text-destructive">{error}</p>}
  </div>;
}
