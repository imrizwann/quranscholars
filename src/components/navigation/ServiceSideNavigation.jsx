import { useEffect, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ArrowLeft, Grid2X2 } from "lucide-react";
import { serviceCatalog } from "@/data/servicesData.js";

const ServiceSideNavigation = ({ layout = "sidebar" }) => {
  const { pathname } = useLocation();
  const itemRefs = useRef({});
  const listRef = useRef(null);
  const isTop = layout === "top";

  useEffect(() => {
    if (!isTop) return;
    const list = listRef.current;
    const item = itemRefs.current[pathname];
    if (!list || !item) return;
    const itemRect = item.getBoundingClientRect();
    const listRect = list.getBoundingClientRect();
    list.scrollTo({
      left: list.scrollLeft + itemRect.left - listRect.left - (listRect.width - itemRect.width) / 2,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  }, [isTop, pathname]);

  return (
    <nav className={isTop ? "mx-auto flex max-w-7xl items-center gap-2 px-4 py-2 sm:px-6" : "rounded-2xl border border-[#dfe6e2] bg-white p-3"} aria-label="Services navigation">
      <NavLink to="/services" className={({ isActive }) => `inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-black no-underline transition ${isActive ? "bg-[#0f766e] text-white" : "text-[#52655c] hover:bg-[#eef4f1] hover:text-primary"}`}>
        {isTop ? <ArrowLeft className="size-3.5" /> : <Grid2X2 className="size-3.5" />}
        All services
      </NavLink>
      <ul ref={listRef} className={isTop ? "flex min-w-0 flex-1 gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" : "mt-2 grid gap-1"}>
        {serviceCatalog.map(({ slug, label, icon: Icon }) => {
          const to = `/services/${slug}`;
          return (
            <li key={to} ref={(element) => { itemRefs.current[to] = element; }} className="shrink-0">
              <NavLink to={to} className={({ isActive }) => `inline-flex min-h-9 items-center gap-2 whitespace-nowrap rounded-lg px-3 text-xs font-black no-underline transition ${isActive ? "bg-[#e2f1eb] text-[#0b6159]" : "text-[#5e7168] hover:bg-[#f2f6f4] hover:text-[#173b31]"}`}>
                <Icon className="size-3.5" />{label}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default ServiceSideNavigation;
