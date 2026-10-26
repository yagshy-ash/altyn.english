const COLORS = ["bg-blue", "bg-green", "bg-orange", "bg-purple", "bg-pink", "bg-teal", "bg-red", "bg-yellow"];

// Ada göre sabit renkli baş harf avatarı; online ise yeşil nokta
export function Avatar({ name, online, size = "md" }: { name: string; online?: boolean; size?: "md" | "lg" }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const color = COLORS[[...name].reduce((n, c) => n + c.charCodeAt(0), 0) % COLORS.length];
  const box = size === "lg" ? "size-20 text-2xl" : "size-10 text-sm";
  return (
    <span className={`relative grid shrink-0 place-items-center rounded-full font-black text-white ${box} ${color}`}>
      {initials}
      {online !== undefined && (
        <span className={`absolute right-0 bottom-0 rounded-full border-2 border-sheet ${size === "lg" ? "size-5" : "size-3.5"} ${online ? "bg-green" : "bg-line"}`} />
      )}
    </span>
  );
}
