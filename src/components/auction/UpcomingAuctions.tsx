import Image from "next/image";

const auctions = [
  {
    name: "Air Jordan 1 Retro 'Chicago'",
    price: "5.0 SOL",
    startsIn: "45 min",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80",
  },
  {
    name: "Yeezy Boost 350 V2 Zebra",
    price: "2.5 SOL",
    startsIn: "1h 20m",
    image: "https://images.unsplash.com/photo-1606107557195-0a74c716b7a2?w=400&q=80",
  },
  {
    name: "Bored Ape #4823",
    price: "45 SOL",
    startsIn: "2h",
    image: "https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?w=400&q=80",
  },
  {
    name: "PS5 Console Bundle",
    price: "1.2 SOL",
    startsIn: "3h",
    image: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=400&q=80",
  },
];

export default function UpcomingAuctions() {
  return (
    <section className="mt-5">
      <h2 className="mb-4 text-base font-semibold text-white">
        Upcoming Auctions
      </h2>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {auctions.map((auction) => (
          <article
            key={auction.name}
            className="group overflow-hidden rounded-2xl border border-border bg-surface transition-colors hover:border-accent/50"
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-surface-elevated">
              <Image
                src={auction.image}
                alt={auction.name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div className="p-3.5">
              <h3 className="truncate text-sm font-medium text-white">
                {auction.name}
              </h3>
              <p className="mt-1 text-sm font-semibold text-accent">
                Starting {auction.price}
              </p>
              <p className="mt-0.5 text-xs text-muted">
                Starts in {auction.startsIn}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
