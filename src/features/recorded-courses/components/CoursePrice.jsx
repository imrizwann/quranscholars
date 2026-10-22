const formatPrice = (amount, currency = "INR") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
  }).format(amount);

const CoursePrice = ({ price, size = "default", light = false }) => {
  const current = Number(price?.current || 0);
  const original = Number(price?.original || 0);
  const discounted = Boolean(price?.discounted);

  return (
    <div className="flex flex-wrap items-baseline gap-2">
      <span className={`${size === "large" ? "text-3xl" : "text-lg"} font-black ${light ? "text-white" : "text-[#172b24]"}`}>
        {current === 0 ? "Free" : formatPrice(current, price?.currency)}
      </span>
      {discounted && original > 0 && (
        <span className={`text-sm font-semibold line-through ${light ? "text-white/50" : "text-[#8a958f]"}`}>
          {formatPrice(original, price?.currency)}
        </span>
      )}
    </div>
  );
};

export default CoursePrice;
