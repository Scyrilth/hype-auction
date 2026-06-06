const AVATAR_GRADIENTS = [
  "from-orange-400 to-red-500",
  "from-yellow-400 to-amber-500",
  "from-green-400 to-emerald-500",
  "from-blue-400 to-indigo-500",
  "from-pink-400 to-rose-500",
  "from-purple-400 to-violet-500",
  "from-cyan-400 to-teal-500",
  "from-fuchsia-400 to-pink-500",
];

export function avatarGradientForWallet(walletAddress: string) {
  let hash = 0;
  for (let i = 0; i < walletAddress.length; i++) {
    hash = (hash + walletAddress.charCodeAt(i)) % AVATAR_GRADIENTS.length;
  }
  return AVATAR_GRADIENTS[hash];
}
