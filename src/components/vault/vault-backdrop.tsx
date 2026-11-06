export function VaultBackdrop() {
  return (
    <>
      <img
        src="/.netlify/images?url=/img/vault.png&w=1800&fm=webp&q=75"
        srcSet="/.netlify/images?url=/img/vault.png&w=900&fm=webp&q=70 900w, /.netlify/images?url=/img/vault.png&w=1800&fm=webp&q=75 1800w"
        sizes="100vw"
        alt=""
        aria-hidden="true"
        className="fixed inset-0 -z-20 h-full w-full object-cover"
      />
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-black/60 via-black/80 to-black/95" />
    </>
  )
}
