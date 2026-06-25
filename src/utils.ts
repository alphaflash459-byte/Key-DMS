import { Item } from './types';

/**
 * Calculates the total free promotional quantity (FOC/Bonus items)
 * and returns a clear descriptive Khmer label for the applied bundles.
 */
export const calculateFreePromoQty = (item: Item, qty: number): { freeQty: number; label: string } => {
  if (!item.promoPackages || item.promoPackages.length === 0 || qty <= 0) {
    return { freeQty: 0, label: '' };
  }

  // Sort promo packages by buyQty descending to match the largest package first
  const sorted = [...item.promoPackages].sort((a, b) => b.buyQty - a.buyQty);

  let remainingQty = qty;
  let totalFree = 0;
  const matchedLabels: string[] = [];

  for (const promo of sorted) {
    if (promo.buyQty <= 0) continue;
    const count = Math.floor(remainingQty / promo.buyQty);
    if (count > 0) {
      totalFree += count * promo.freeQty;
      remainingQty -= count * promo.buyQty;
      matchedLabels.push(`${count}x [ទិញ ${promo.buyQty} ថែម ${promo.freeQty}]`);
    }
  }

  return {
    freeQty: totalFree,
    label: matchedLabels.join(' + ')
  };
};

/**
 * Calculates the average divided price when the user chooses NOT to take FOC items
 * but instead take a discounted "divided unit price" for the total items.
 * Formula: Unit Price = (buyQty * standardPrice) / (buyQty + freeQty)
 */
export const calculateDividedPrice = (item: Item, qty: number): { price: number; label: string; matchedPromo?: any } => {
  if (!item.promoPackages || item.promoPackages.length === 0 || qty <= 0) {
    return { price: item.price, label: '' };
  }

  // Sort promo packages by buyQty descending
  const sorted = [...item.promoPackages].sort((a, b) => b.buyQty - a.buyQty);

  // We look for the package that fits within the total quantity range.
  // In divided price mode, total quantity Qty represents the total items received.
  // So we match the promo where total bundle size (buyQty + freeQty) is <= Qty,
  // OR where buyQty is <= Qty. Let's find the largest promo package where the input qty >= buyQty.
  const matchedPromo = sorted.find(promo => qty >= promo.buyQty);

  if (matchedPromo && matchedPromo.buyQty > 0) {
    const totalBundleQty = matchedPromo.buyQty + matchedPromo.freeQty;
    const dividedPrice = (matchedPromo.buyQty * item.price) / totalBundleQty;
    return {
      price: Number(dividedPrice.toFixed(4)), // Maintain 4-decimal precision for calculation
      label: `ចែកដាច់ឈុត ${matchedPromo.buyQty}+${matchedPromo.freeQty} ($${dividedPrice.toFixed(2)})`,
      matchedPromo
    };
  }

  return { price: item.price, label: '' };
};
