const Card = ({ children }) => {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl shadow-xl p-6">
      {children}
    </div>
  );
};

export default Card;