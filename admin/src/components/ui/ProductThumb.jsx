export default function ProductThumb({ image, name = "", className = "" }) {
  return <span className={`grid shrink-0 place-items-center overflow-hidden rounded-md bg-red-50 text-sm font-extrabold text-brand-700 ${className}`}>{image ? <img className="h-full w-full object-cover" src={image} alt="" /> : name.slice(0, 1).toUpperCase()}</span>;
}
