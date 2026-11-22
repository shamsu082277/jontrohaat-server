import { MongoClient, ObjectId } from "mongodb";
import { env } from "../src/config/env.js";

export const DEMO_EQUIPMENT_DATA = [
  {
    title: "Dongfeng 12HP Walking Power Tiller",
    description: "Heavy duty 12HP water-cooled diesel engine power tiller. Equipped with 18-blade rotavator, high torque transmission, and anti-skid steel cage wheels for muddy wetland boro preparation.",
    category: "Power Tillers",
    rentalPrice: 1800,
    rentalType: "per_day",
    securityDeposit: 3000,
    availableQuantity: 3,
    condition: "Excellent – Serviced Recently",
    brand: "Dongfeng",
    model: "DF-121 Diesel",
    image: "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=1200&q=80",
    ],
    location: {
      division: "Rajshahi",
      district: "Bogura",
      upazila: "Sherpur",
      address: "Mirzapur Road, Sherpur Bazar, Bogura",
    },
    rentalTerms: "Fuel costs must be borne by the renter (diesel).\nExperienced driver can be arranged for ৳500/day extra.\nDelivery available within 15 km of Sherpur.\nNational ID / NID card photocopy required at hand-over.",
    status: "approved",
    isFeatured: true,
  },
  {
    title: "Kubota DC-70 Plus Combine Harvester",
    description: "World-class 70HP crawler combine harvester for rapid harvesting, threshing, and cleaning of paddy and wheat. Cuts up to 4 bighas per hour with minimal grain loss.",
    category: "Harvesters",
    rentalPrice: 14500,
    rentalType: "per_day",
    securityDeposit: 15000,
    availableQuantity: 1,
    condition: "Like New – 2025 Model with certified operator",
    brand: "Kubota",
    model: "DC-70 Plus G",
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=1200&q=80",
    ],
    location: {
      division: "Rangpur",
      district: "Dinajpur",
      upazila: "Birol",
      address: "College More, Birol Highway, Dinajpur",
    },
    rentalTerms: "Comes with a certified factory-trained operator.\nDiesel provided by renter at actual site consumption.\nMinimum booking duration: 1 full day.\nTrailer transport cost negotiable based on distance.",
    status: "approved",
    isFeatured: true,
  },
  {
    title: "Mahindra 575 DI 45HP Farm Tractor",
    description: "Reliable 45HP 4-cylinder direct injection tractor. High backup torque, includes 36-blade rotary tiller and heavy-duty hydraulic tipping trailer attachment.",
    category: "Tractors",
    rentalPrice: 3500,
    rentalType: "per_day",
    securityDeposit: 5000,
    availableQuantity: 2,
    condition: "Good Working Condition – Thoroughly checked",
    brand: "Mahindra",
    model: "575 DI Bhoomiputra",
    image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=1200&q=80",
    ],
    location: {
      division: "Chattogram",
      district: "Cumilla",
      upazila: "Chandina",
      address: "Chandina Palli Bidyut Road, Cumilla",
    },
    rentalTerms: "Includes rotavator and cultivator attachments.\nTrolley attachment available on request for ৳800/day extra.\nOperator available upon advance notice.",
    status: "approved",
    isFeatured: true,
  },
  {
    title: "Honda GX160 3-Inch High Volume Water Pump",
    description: "Original 4-stroke Honda petrol engine 3-inch self-priming water pump. Delivers up to 1,000 liters per minute with 28-meter head. Includes 60-foot flexible delivery hose.",
    category: "Irrigation Pumps",
    rentalPrice: 750,
    rentalType: "per_day",
    securityDeposit: 1500,
    availableQuantity: 5,
    condition: "Excellent – Quick pull-start every time",
    brand: "Honda",
    model: "WB30XT High Head",
    image: "https://images.unsplash.com/photo-1560493676-04071c5f467b?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1560493676-04071c5f467b?auto=format&fit=crop&w=1200&q=80",
    ],
    location: {
      division: "Mymensingh",
      district: "Mymensingh",
      upazila: "Trishal",
      address: "Dakkhin Bazar, Trishal, Mymensingh",
    },
    rentalTerms: "Fuel: Octane or Petrol (0.8L per hour average).\nComes with suction pipe and foot valve strainer.\nDeposit refundable immediately upon safe return.",
    status: "approved",
    isFeatured: true,
  },
  {
    title: "STIHL SR-420 Petrol Backpack Mistblower & Sprayer",
    description: "German-engineered 56.5cc powerful backpack mistblower. Reaches up to 12 meters horizontal spray distance for orchards, vegetable plots, and paddy blast disease protection.",
    category: "Sprayers",
    rentalPrice: 450,
    rentalType: "per_day",
    securityDeposit: 1000,
    availableQuantity: 6,
    condition: "Like New – Cleaned and calibrated nozzles",
    brand: "STIHL",
    model: "SR 420 Professional",
    image: "https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=1200&q=80",
    ],
    location: {
      division: "Khulna",
      district: "Jessore",
      upazila: "Jhikargachha",
      address: "Flower Market Road, Godkhali, Jessore",
    },
    rentalTerms: "Requires 2-stroke petrol oil blend (50:1 ratio).\nMust be flushed with fresh water before return.\nProtective respirator mask provided free of charge.",
    status: "approved",
    isFeatured: true,
  },
  {
    title: "Heavy-Duty Multi-Crop Power Thresher (Blower Model)",
    description: "Automatic straw-separation power thresher driven by 16HP diesel engine. Processes paddy, wheat, and pulses with 99% grain purity and zero breakage.",
    category: "Threshers",
    rentalPrice: 1600,
    rentalType: "per_day",
    securityDeposit: 3000,
    availableQuantity: 2,
    condition: "Fully Refurbished – Balanced drum & sharp teeth",
    brand: "Janata Engineering",
    model: "JT-400 Super Clean",
    image: "https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=1200&q=80",
    ],
    location: {
      division: "Rajshahi",
      district: "Naogaon",
      upazila: "Mohadevpur",
      address: "Paddy Silo Road, Mohadevpur, Naogaon",
    },
    rentalTerms: "Towable by walking tractor or pickup van.\n16HP Changchai engine included in rental.\nOperator can be provided for ৳400/day extra.",
    status: "approved",
    isFeatured: true,
  },
  {
    title: "Sifang 16HP High-Torque Power Tiller",
    description: "Direct injection heavy power tiller popular for clay-rich deep cultivation and dry seed-bed making. Rugged iron wheels included.",
    category: "Power Tillers",
    rentalPrice: 2000,
    rentalType: "per_day",
    securityDeposit: 3500,
    availableQuantity: 2,
    condition: "Good Condition – Recent oil & clutch change",
    brand: "Sifang",
    model: "GN-121 16HP",
    image: "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=1200&q=80",
    ],
    location: {
      division: "Rangpur",
      district: "Rangpur",
      upazila: "Mithapukur",
      address: "Mithapukur High School Gate, Rangpur",
    },
    rentalTerms: "Renter supplies fuel.\nLocal pickup or small trailer delivery.",
    status: "approved",
    isFeatured: false,
  },
  {
    title: "Taishan 50HP Dual-Clutch 4WD Agricultural Tractor",
    description: "Four-wheel drive heavy tractor with power steering and hydraulic control. Unstoppable in wet marshes and heavy loam soil.",
    category: "Tractors",
    rentalPrice: 4200,
    rentalType: "per_day",
    securityDeposit: 6000,
    availableQuantity: 1,
    condition: "Clean Working Condition – Ready for deployment",
    brand: "Taishan",
    model: "TS-504 4WD",
    image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1200&q=80",
    ],
    location: {
      division: "Dhaka",
      district: "Tangail",
      upazila: "Mirzapur",
      address: "Gorai Industrial Area, Mirzapur, Tangail",
    },
    rentalTerms: "Advance booking required.\nCertified driver mandatory.",
    status: "approved",
    isFeatured: false,
  },
  {
    title: "Yanmar 4-Row High Speed Paddy Transplanter",
    description: "Self-propelled 4-row mechanical rice seedling transplanter. Plants 12-15 bighas per day with uniform plant spacing and depth, minimizing seed waste.",
    category: "Harvesters",
    rentalPrice: 5500,
    rentalType: "per_day",
    securityDeposit: 8000,
    availableQuantity: 2,
    condition: "Factory Refurbished – High Precision Fingers",
    brand: "Yanmar",
    model: "VP4E Walk-Behind",
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80",
    ],
    location: {
      division: "Rajshahi",
      district: "Rajshahi",
      upazila: "Godagari",
      address: "Bypass Road, Godagari Bazar, Rajshahi",
    },
    rentalTerms: "Requires nursery tray seedlings (mat type).\nOperator included with rental.\nCleaning after use required.",
    status: "approved",
    isFeatured: true,
  },
  {
    title: "Kirloskar 8HP Heavy Duty Diesel Water Pump",
    description: "Slow-speed 8HP water-cooled diesel pump engine with 4-inch cast iron centrifugal pump. Ideal for round-the-clock canal and boro crop irrigation.",
    category: "Irrigation Pumps",
    rentalPrice: 950,
    rentalType: "per_day",
    securityDeposit: 2000,
    availableQuantity: 4,
    condition: "Robust & Proven – Fuel efficient 0.9L/hr",
    brand: "Kirloskar",
    model: "DM-8 Water Cooled",
    image: "https://images.unsplash.com/photo-1560493676-04071c5f467b?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1560493676-04071c5f467b?auto=format&fit=crop&w=1200&q=80",
    ],
    location: {
      division: "Rajshahi",
      district: "Pabna",
      upazila: "Ishwardi",
      address: "Pakshi Railway Road, Ishwardi, Pabna",
    },
    rentalTerms: "Includes 40ft suction and 100ft delivery pipe.\nDiesel to be supplied by renter.\nCart mounted for easy field movement.",
    status: "approved",
    isFeatured: false,
  },
];

export async function seedEquipment() {
  const client = new MongoClient(env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  try {
    await client.connect();
    const db = client.db(env.DB_NAME);
    const equipmentCollection = db.collection("equipment");
    const userCollection = db.collection(env.AUTH_USER_COLLECTION || "user");

    // 1. Ensure a demo owner exists
    let owner = await userCollection.findOne({ role: "owner" });
    if (!owner) {
      const ownerId = new ObjectId().toString();
      const now = new Date();
      const newOwner = {
        _id: ownerId,
        name: "Haji Nurul Islam",
        email: "nurul.islam.bogura@gmail.com",
        phone: "01712-345678",
        district: "Bogura",
        division: "Rajshahi",
        role: "owner",
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
      };
      await userCollection.insertOne(newOwner);
      owner = newOwner;
      console.log("[Equipment Seed] Created demo owner: Haji Nurul Islam");
    }

    const ownerObjectId = typeof owner._id === "string" ? new ObjectId(owner._id) : owner._id;

    // 2. Insert items if they do not already exist (idempotent by title)
    let addedCount = 0;
    const now = new Date();

    for (const item of DEMO_EQUIPMENT_DATA) {
      const existing = await equipmentCollection.findOne({ title: item.title });
      if (!existing) {
        await equipmentCollection.insertOne({
          ...item,
          ownerId: ownerObjectId,
          createdAt: now,
          updatedAt: now,
        });
        addedCount++;
      }
    }

    const totalCount = await equipmentCollection.countDocuments();
    console.log(`[Equipment Seed] Added ${addedCount} new equipment listings. Total now: ${totalCount}`);
    return { success: true, addedCount, totalCount };
  } finally {
    await client.close();
  }
}

if (process.argv[1]?.endsWith("seedEquipment.js")) {
  seedEquipment()
    .then((res) => {
      console.log(res);
      process.exit(0);
    })
    .catch((err) => {
      console.error("[Equipment Seed Error]:", err.message);
      process.exit(1);
    });
}
