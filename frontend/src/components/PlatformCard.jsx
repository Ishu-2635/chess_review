
const PlatformCard = ({
  title,
  icon,
  value,
  selected,
  onSelect,
}) => {
  const active = selected === value;

  return (
    <button
      onClick={() => onSelect(value)}
      className={`
      relative
      flex
      flex-col
      items-center
      justify-center
      rounded-xl
      p-5
      border
      transition-all
      duration-300
      hover:-translate-y-1

      ${
        active
          ? "border-amber-400 bg-amber-400/10 shadow-lg shadow-amber-500/20"
          : "border-neutral-700 bg-neutral-800 hover:border-amber-400/40"
      }
      `}
    >
      <div className="mb-3">{icon}</div>

      <span
        className={`font-medium ${
          active ? "text-amber-400" : "text-neutral-300"
        }`}
      >
        {title}
      </span>

      {active && (
        <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-amber-400"></div>
      )}
    </button>
  );
};

export default PlatformCard;