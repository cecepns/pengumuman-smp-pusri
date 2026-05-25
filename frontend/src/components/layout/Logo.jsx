import logoImg from "@/assets/logo.png";

export { logoImg };

export default function Logo({ className = "h-20 w-20", showText = true }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <img
        src={logoImg}
        alt="Logo SMP PUSRI Palembang"
        className={`${className} object-contain`}
      />
      {showText && (
        <div className="text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-pusri-gold">
            Yayasan Sosial Pendidikan
          </p>
          <h1 className="text-lg font-bold text-pusri-blue sm:text-xl">
            SMP PUSRI Palembang
          </h1>
        </div>
      )}
    </div>
  );
}
