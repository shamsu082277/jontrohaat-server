export function serializeEquipment(item, owner = {}) {
  const location = typeof item.location === "object" && item.location !== null
    ? item.location
    : { division: "", district: String(item.location || "") };
  const images = Array.isArray(item.images)
    ? item.images
    : item.image
      ? [item.image]
      : [];
  const image = images[0] || "";
  const ownerId = String(item.ownerId);
  return {
    ...item,
    _id: String(item._id),
    ownerId,
    image,
    images,
    location,
    rentalPrice: item.rentalPrice,
    pricePerDay: item.rentalPrice,
    availableQuantity: item.availableQuantity,
    quantity: item.availableQuantity,
    isAvailable: item.availableQuantity > 0,
    ownerName: owner.name || "",
    ownerEmail: owner.email || "",
    ownerPhone: owner.phone || "",
    owner: {
      id: ownerId,
      name: owner.name || "",
      phone: owner.phone || "",
      email: owner.email || "",
      district: owner.district || location.district || "",
      division: owner.division || location.division || "",
      verified: false,
      memberSince: owner.createdAt || item.createdAt,
      avatar: owner.image || undefined,
    },
    terms: typeof item.rentalTerms === "string" ? item.rentalTerms.split(/\r?\n/).filter(Boolean) : [],
    isFeatured: item.isFeatured === true,
  };
}
